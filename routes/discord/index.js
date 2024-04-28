const express = require('express');
const router = express.Router();

const crypto = require('crypto');
const axios = require('axios');

const { sql } = require('../../database');
const { isAuthed } = require('../auth/functions')
const { sendLog } = require('../../utils');
const { getDiscordUser, getToken, getExistingAuth, scopes, redirect } = require('../../discord/auth');

const earnRoute = require('./earn');
router.use('/earn', earnRoute);

const tokens = {};

router.get('/', isAuthed, async (req, res) => {

    const discordAuth = await getExistingAuth(req.userId, true);
    if (!discordAuth) return res.json({ status: 'NOT_LINKED' });

    res.json({
        status: 'LINKED',
        user: discordAuth.user
    });

});

router.post('/link', isAuthed, async (req, res) => {

    const discordAuth = await getExistingAuth(req.userId, true);
    if (discordAuth) return res.status(400).json({ error: 'ALREADY_LINKED' });

    const token = crypto.randomUUID();
    tokens[token] = req.userId;

    res.json({ url: `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${scopes.join('%20')}&state=${token}` });

    setTimeout(() => {
        delete tokens[token];
    }, 60000 * 5);

});

router.post('/unlink', isAuthed, async (req, res) => {

    const discordAuth = await getExistingAuth(req.userId, true);
    if (!discordAuth) return res.json({ status: 'UNLINKED' }); // res.json({ status: 'NOT_LINKED' });

    await sql.query('DELETE FROM discordAuths WHERE userId = ?', [req.userId]);
    sendLog('rain', `<@${discordAuth.discordId}> unlinked of BloxClash accountId \`${req.userId}\``);

    res.json({ status: 'UNLINKED' });

});

router.get('/callback', async (req, res) => {

    // res.send('Linking your Discord account... (this page will close automatically in a few seconds)');

    const token = req.query.state;
    const userId = tokens[token];

    if (!userId) return res.send('Link expired'); // io.emit(invalid state)
    delete tokens[token];

    const discordAuth = await getExistingAuth(userId);
    if (discordAuth) return res.render('discord', { discordUser }); // io.emit(already linked)

    const code = req.query.code;
    const data = await getToken(code, redirect, scopes, 'authorization_code');
    if (!data) return res.send('An error occurred while linking your Discord account. Please try again later.');

    const { access_token } = data;
    const discordUser = await getDiscordUser(access_token);

    const [[existing]] = await sql.query('SELECT userId FROM discordAuths WHERE discordId = ?', [discordUser.id]);
    if (existing) return res.send('This Discord account is already linked to another BloxClash account.') // io.emit(already linked)

    const expiresAt = new Date(Date.now() + (data.expires_in * 1000));
    await sql.query('INSERT INTO discordAuths (userId, discordId, token, tokenExpiresAt, refreshToken) VALUES (?, ?, ?, ?, ?)', [userId, discordUser.id, access_token, expiresAt, data.refresh_token]);
    
    res.render('discord', { discordUser });

    // if (!discordClient.bloxClashGuild?.members.cache.has(discordUser.id)) {
    //     await discordClient.bloxClashGuild?.members.add(discordUser.id, { accessToken: access_token });
    // }

    sendLog('rain', `<@${discordUser.id}> (\`${discordUser.username}#${discordUser.discriminator}\`) linked to BloxClash accountId \`${userId}\``);
    // io.to(userId).emit('discord:link', discordUser);

});


module.exports = router;