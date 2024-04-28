const express = require('express');
const router = express.Router();

const axios = require('axios');
const { sql } = require('../../database');
const { sendLog } = require('../../utils');
const { getDiscordUser, getToken, earnRedirect: redirect, earnScopes: scopes } = require('../../discord/auth');

router.get('/', async (req, res) => {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${scopes.join('%20')}`);
});

router.get('/callback', async (req, res) => {

    try {

        const code = req.query.code;
        const data = await getToken(code, redirect, scopes, 'authorization_code');

        if (!data) {
            return res.send('An error occurred, try again later.');
        }

        const { access_token } = data;    
        const discordUser = await getDiscordUser(access_token);
    
        const [[existingDs]] = await sql.query('SELECT id, ip, elegible FROM earnUsers WHERE id = ?', [discordUser.id]);
        
        if (existingDs?.elegible) {
            return res.render('earn/elegible');
        }
    
        if (existingDs?.ip !== req.headers['cf-connecting-ip']) {
            const [[existingIp]] = await sql.query('SELECT id FROM earnUsers WHERE ip = ?', [req.headers['cf-connecting-ip']]);
            if (existingIp) {
                sendLog('earn', `${discordUser.username}#${discordUser.discriminator} (${discordUser.id}) is not elegible, ip is already in use. \`${req.headers['cf-connecting-ip']}\``);
                return res.send('You are not elegible to participate.');
            }
        }
    
        const allowedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com', 'aol.com', 'yandex.com', 'zoho.com', 'protonmail.com', 'proton.me', 'gmx.com'];
    
        async function nonElegible(reason) {
    
            if (!existingDs) {
                await sql.query(
                    'INSERT INTO earnUsers (id, ip, email, token, refreshToken, tokenExpiresAt, elegible) VALUES (?, ?, ?, ?, ?, ?, 0)',
                    [discordUser.id, req.headers['cf-connecting-ip'], discordUser.email, access_token, data.refresh_token, new Date(Date.now() + data.expires_in)]
                );
            }
    
            sendLog('earn', `${discordUser.username}#${discordUser.discriminator} (${discordUser.id}) is not elegible, ${reason}.`);
            return res.render('earn/nonelegible');
    
        }
    
        if (!discordUser.verified) {
            return nonElegible(`account is not verified.`);
        } else if (!allowedDomains.includes(discordUser.email.split('@')[1])) {
            return nonElegible(`email domain is not allowed. \`${discordUser.email}\``);
        } else {
    
            const createdAt = convertNumber(discordUser.id);
    
            if (Date.now() - createdAt < 2592000000) {
                return nonElegible(`account was created less than a month ago.`);
            }
    
            const guilds = await getUserGuilds(access_token);
    
            if (guilds.length < 5) {
                return nonElegible(`user is in less than 5 guilds.`);
            }
    
            await sql.query(`
                INSERT INTO earnUsers (id, ip, email, token, refreshToken, tokenExpiresAt, elegible) VALUES (?, ?, ?, ?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE ip=VALUES(ip), email=VALUES(email), token=VALUES(token), refreshToken=VALUES(refreshToken), tokenExpiresAt=VALUES(tokenExpiresAt), elegible=1`,
                [discordUser.id, req.headers['cf-connecting-ip'], discordUser.email, access_token, data.refresh_token, new Date(Date.now() + data.expires_in)]
            );
    
            sendLog('earn', `${discordUser.username}#${discordUser.discriminator} (${discordUser.id}) is elegible, added to whitelist.`);
            return res.render('earn/elegible');
    
        }
    
    } catch (e) {
        console.error(e);
        return res.send('An error occurred, you can try to login again.');
    }

});

async function getUserGuilds(token) {

    const { data: guilds } = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Encoding': 'gzip, deflate, decompress',
            'Accept': 'application/json'
        }
    });

    return guilds;

}

function convertNumber(number) {

    let id = parseInt(number);

    let binary = id.toString(2);
    binary = binary.padStart(64, "0");

    let excerpt = binary.substring(0, 42);
    let decimal = parseInt(excerpt, 2);

    let unix = parseInt(decimal) + 1420070400000;
    return unix;

}

module.exports = router;