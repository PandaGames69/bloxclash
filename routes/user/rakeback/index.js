const express = require('express');
const router = express.Router();

const { doTransaction } = require('../../../database');

const { isAuthed, apiLimiter } = require('../../auth/functions');
const { roundDecimal, sendLog, newNotification } = require('../../../utils');
const io = require('../../../socketio/server');
const { enabledFeatures } = require('../../admin/config');
const { rakebackTypes, getUserRakebacks, cachedRakebacks, startDate } = require('./functions');

router.get('/', [isAuthed, apiLimiter], async (req, res) => {

    const userRakebacks = await getUserRakebacks(req.userId);
    res.json({
        serverTime: Date.now(),
        ...userRakebacks
    });

});

router.post('/claim', [isAuthed, apiLimiter], async (req, res) => {

    if (!enabledFeatures.rakeback) return res.status(400).json({ error: 'DISABLED' });

    const type = req.body.type;
    if (typeof type != 'string' || !rakebackTypes[type]) return res.status(400).json({ error: 'INVALID_TYPE' });

    try {

        await doTransaction(async (connection, commit) => {

            const [[user]] = await connection.query('SELECT id, username, balance FROM users WHERE id = ? FOR UPDATE', [req.userId]);

            const [[lastClaim]] = await connection.query('SELECT id, createdAt FROM rakebackClaims WHERE userId = ? AND type = ? ORDER BY id DESC LIMIT 1', [req.userId, type]);
            const lastClaimDate = lastClaim?.createdAt || startDate;
    
            if (Date.now() - lastClaimDate < rakebackTypes[type].cooldown) return res.status(400).json({ error: 'COOLDOWN' });
    
            const [[unclaimed]] = await connection.query('SELECT SUM(edge) as total FROM bets WHERE userId = ? AND createdAt > ? AND completed = 1', [req.userId, lastClaimDate]);
            const houseEdge = unclaimed.total || 0;
            const rakeback = roundDecimal(houseEdge * rakebackTypes[type].percentage / 100);
    
            if (rakeback < rakebackTypes[type].min) return res.status(400).json({ error: 'NOT_ENOUGH_RAKEBACK' });
    
            const [result] = await connection.query('INSERT INTO rakebackClaims (userId, type, amount) VALUES (?, ?, ?)', [user.id, type, rakeback]);
            await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [rakeback, user.id]);
    
            const [txResult] = await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [user.id, rakeback, 'in', 'rakeback', result.insertId]);
            await newNotification(user.id, 'reward-claimed', { txId: txResult.insertId, amount: rakeback }, connection);
    
            await commit();
            io.to(user.id).emit('balance', 'set', roundDecimal(user.balance + rakeback));
    
            delete cachedRakebacks[user.id];
            res.json({ success: true });
    
            sendLog('rakeback', `*${user.username}* (\`${user.id}\`) claimed ${type} rakeback for :robux: R$${rakeback}`);

        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

});

module.exports = router;