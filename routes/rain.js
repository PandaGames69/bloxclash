const axios = require('axios');
const FormData = require('form-data');

const express = require('express');
const router = express.Router();

const io = require('../socketio/server');
const { sql, doTransaction } = require('../database');

const { isAuthed, apiLimiter } = require('./auth/functions');
const { roundDecimal, sendLog, getUserLevel } = require('../utils');
const { getExistingAuth } = require('../discord/auth');
const { rains } = require('../socketio/rain');
const { newMessage } = require('../socketio/chat/functions');
const { enabledFeatures, checkAccountLock } = require('./admin/config');

router.use((req, res, next) => {
    if (!enabledFeatures.rain) return res.status(400).json({ error: 'DISABLED' });
    next();
});

router.post('/join', [isAuthed, apiLimiter], async (req, res) => {

    const linkedDiscord = await getExistingAuth(req.userId, true);
    if (!linkedDiscord) return res.status(400).json({ error: 'NOT_LINKED' });

    // if (!discordClient.bloxClashGuild?.members.cache.has(linkedDiscord.user.id)) {
    //     discordClient.bloxClashGuild?.members.add(linkedDiscord.discordId, { accessToken: linkedDiscord.token });
    // }

    const [[userWagered]] = await sql.query('SELECT SUM(amount) AS wagered FROM bets WHERE userId = ? AND completed = 1 AND createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)', [req.userId]);
    if (userWagered.wagered < 2500) return res.status(400).json({ error: 'NOT_ENOUGH_WAGERED' });

    const [[lastWeekDeposits]] = await sql.query('SELECT COALESCE(SUM(amount), 0) as sum FROM transactions WHERE userId = ? AND type = ? AND createdAt > ?', [req.userId, 'deposit', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)]);
    if (lastWeekDeposits.sum < 200) return res.status(400).json({ error: 'INSUFFICIENT_DEPOSITS' });

    // console.log(req.body);

    const captchaResponse = req.body['captchaResponse'];
    if (!captchaResponse) return res.status(400).json({ error: 'CAPTCHA_REQUIRED' });

    const captchaForm = new FormData();
    captchaForm.append('secret', process.env.HCAPTCHA_SECRET);
    captchaForm.append('response', captchaResponse);
    captchaForm.append('remoteip', req.headers['cf-connecting-ip']);
    captchaForm.append('sitekey', process.env.HCAPTCHA_SITE_KEY);

    const { data: verifyCaptcha } = await axios({
        method: 'POST',
        url: 'https://api.hcaptcha.com/siteverify',
        data: captchaForm,
        headers: {
            'Content-Type': 'multipart/form-data',
            ...captchaForm.getHeaders(),
            'Accept-Encoding': 'gzip, deflate, decompress'
        }
    });

    // console.log(verifyCaptcha);
    if (!verifyCaptcha.success) return res.status(400).json({ error: 'INVALID_CAPTCHA' });

    let rain;

    if (rains.system.joinable) {

        // if (rains.system.users.includes(req.userId)) return res.status(400).json({ error: 'ALREADY_JOINED_RAIN' });
        rain = rains.system;

    } else if (rains.user?.joinable) {

        if (rains.user.host.id == req.userId) return res.status(400).json({ error: 'CANNOT_JOIN_OWN_RAIN' });
        rain = rains.user;
    
    } else {
        return res.status(404).json({ error: 'RAIN_NOT_FOUND' });
    }

    if (rain.users.includes(req.userId)) return res.status(400).json({ error: 'ALREADY_JOINED_RAIN' });

    try {

        await doTransaction(async (connection, commit, rollback) => {
            const [[user]] = await connection.query('SELECT id, username, sponsorLock, rainBan, accountLock, balance, verified, xp, ip FROM users WHERE id = ? FOR UPDATE', [req.userId]);
            if (user.sponsorLock) return res.status(400).json({ error: 'SPONSOR_LOCK' });
    
            user.accountLock = await checkAccountLock(user);
            if (user.rainBan || user.accountLock) return res.status(400).json({ error: 'RAIN_BANNED' });

            const [[multi]] = await connection.query('SELECT users.id FROM rainUsers JOIN users ON users.id = rainUsers.userId WHERE rainUsers.rainId = ? AND users.ip = ?', [rain.id, user.ip]);
            if (multi) return res.status(400).json({ error: 'ALREADY_JOINED_RAIN' });
            
            const [userRains] = await connection.query('SELECT rainId FROM rainUsers WHERE userId = ? AND DATE(createdAt) = CURDATE()', [req.userId]);
            if (userRains.length >= 24) {
                sendLog('rain', `*${user.username}* (\`${user.id}\`) tried to join rain #${rain.id} but he has already joined more than 24 rains today.`);
                return res.status(400).json({ error: 'JOINED_TOO_MANY_RAINS' });
            }
        
            await connection.query('INSERT INTO rainUsers (rainId, userId) VALUES (?, ?)', [rain.id, req.userId]);
            
            await commit();
            rain.users.push(user.id);
            res.json({ success: true });    
            // sendLog('rain', `*${user.username}* (\`${user.id}\`) joined the rain #${rain.id}.`);
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'SERVER_ERROR' });
    }

});

router.post('/tip', [isAuthed, apiLimiter], async (req, res) => {
    
    if (!req.body.amount || typeof req.body.amount !== 'number') return res.status(400).json({ error: 'INVALID_AMOUNT' });
    const amount = roundDecimal(req.body.amount);

    if (amount < 25) return res.status(400).json({ error: 'MIN_RAIN_TIP' });
    if (amount > 1000000) return res.status(400).json({ error: 'INVALID_AMOUNT' });

    try {

        await doTransaction(async (connection, commit, rollback) => {
            
            const [[user]] = await connection.query('SELECT id, username, role, xp, balance, rainBan, verified, tipBan, accountLock, sponsorLock, rainTipAllowance FROM users WHERE id = ? FOR UPDATE', [req.userId]);

            const level = getUserLevel(user.xp);
            if (level < 5) return res.status(400).json({ error: 'LEVEL_REQUIREMENT_RAIN' });

            user.accountLock = await checkAccountLock(user);
            if (user.rainBan || user.tipBan || user.accountLock) return res.status(400).json({ error: 'RAIN_BANNED' });
            if (amount > user.balance) return res.status(400).json({ error: 'INSUFFICIENT_BALANCE' });

            if (user.rainTipAllowance != null && amount > user.rainTipAllowance) {
                return res.status(400).json({ error: 'EXCEEDED_MAX_TIP' });
            }

            const rain = rains.system;
            if (!rain || rain.ended) return res.status(404).json({ error: 'RAIN_NOT_FOUND' });

            if (user.rainTipAllowance == null) {
                await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, user.id]);
            } else {
                await connection.query('UPDATE users SET balance = balance - ?, rainTipAllowance = rainTipAllowance - ? WHERE id = ?', [amount, amount, user.id]);
            }

            await connection.query('INSERT INTO rainTips (rainId, userId, amount) VALUES (?, ?, ?)', [rain.id, user.id, amount]);
            await connection.query('UPDATE rains SET amount = amount + ? WHERE id = ?', [amount, rain.id]);

            const [result] = await connection.query('INSERT INTO chatMessages(type, senderId, content) VALUES (?, ?, ?)', ['rain-tip', user.id, amount]);
            await commit();

            newMessage({
                id: result.insertId,
                content: amount,
                type: 'rain-tip',
                createdAt: Date.now(),
                replyTo: null,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    xp: user.xp
                }
            });

            rain.amount += amount;
            io.emit('rain:pot', rain.amount);
            io.to(user.id).emit('balance', 'set', roundDecimal(user.balance - amount));

            res.json({ success: true });
            sendLog('rain', `*${user.username}* (\`${user.id}\`) tipped :robux: R$${amount} to rain #${rain.id}.`);

        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'SERVER_ERROR' });
    }

});

module.exports = router;