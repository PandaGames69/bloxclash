const axios = require('axios');
const { sql } = require('../database');
const { formatConsoleError, sendLog } = require('../utils');

const redirect = `${process.env.BASE_URL}/discord/callback`;
const scopes = ['identify', 'guilds.join'];

const earnRedirect = `${process.env.BASE_URL}/discord/earn/callback`;
const earnScopes = ['identify', 'guilds', 'email', 'guilds.join'];

async function getToken(refreshToken, redirectUrl = redirect, scopesArr = scopes, grantType = 'refresh_token') {

    try {

        const params = {
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: grantType,
            redirect_uri: redirectUrl,
            scope: scopesArr.join(' ')
        };

        if (grantType == 'authorization_code') {
            params.code = refreshToken;
        } else if (grantType == 'refresh_token') {
            params.refresh_token = refreshToken;
        } else {
            throw new Error('Invalid grant type');
        }

        const { data } = await axios({
            url: 'https://discord.com/api/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept-Encoding': 'gzip, deflate, decompress',
                'Accept': 'application/json'
            },
            data: new URLSearchParams(params)
        });
    
        return data;

    } catch (e) {
        console.error(formatConsoleError(e));
        return null;
    }

}

async function getDiscordUser(token) {

    try {

        const { data: user } = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${token}`,
                'Accept-Encoding': 'gzip, deflate, decompress',
                'Accept': 'application/json'
            }
        });
    
        return user;

    } catch (e) {
        console.error(formatConsoleError(e));
        return null;
    }

}

async function getExistingAuth(userId, checkToken = false) {

    let [[discordAuth]] = await sql.query('SELECT discordId, token, tokenExpiresAt, refreshToken FROM discordAuths WHERE userId = ?', [userId]);
    if (!discordAuth) return null;

    if (!checkToken) return discordAuth;

    if (discordAuth.tokenExpiresAt < Date.now()) {

        const oauthInfo = await getToken(discordAuth.refreshToken);
        if (!oauthInfo) return unlinkDiscord(discordAuth, userId);

        const { access_token, refresh_token, expires_in } = oauthInfo;
        const tokenExpiresAt = new Date(Date.now() + (expires_in * 1000));

        await sql.query('UPDATE discordAuths SET token = ?, tokenExpiresAt = ?, refreshToken = ? WHERE userId = ?', [access_token, tokenExpiresAt, refresh_token, userId]);

        discordAuth = {
            token: access_token,
            tokenExpiresAt,
            refreshToken: refresh_token
        }

    }

    const user = await getDiscordUser(discordAuth.token);
    if (!user) return unlinkDiscord(discordAuth, userId);

    return { ...discordAuth, user };

}

async function unlinkDiscord(discordAuth, userId) {
    await sql.query('DELETE FROM discordAuths WHERE userId = ?', [userId]);
    sendLog('rain', `<@${discordAuth.discordId}> unlinked of BloxClash accountId \`${userId}\` (Reason: Invalid token)`);
    return null;
}

module.exports = {
    redirect,
    scopes,
    earnRedirect,
    earnScopes,
    getToken,
    getDiscordUser,
    getExistingAuth
}