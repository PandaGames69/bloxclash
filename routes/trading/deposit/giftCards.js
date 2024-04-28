const express = require('express');
const router = express.Router();

const { doTransaction } = require('../../../database');

const { isAuthed, apiLimiter } = require('../../auth/functions');
const { roundDecimal, sendLog, newNotification } = require('../../../utils');
const io = require('../../../socketio/server');
const { enabledFeatures, depositBonus } = require('../../admin/config');
const { cryptoData } = require('../crypto/deposit/functions');

router.post('/redeem', [isAuthed, apiLimiter], async (req, res) => {

    if (!enabledFeatures.fiatDeposits) return res.status(400).json({ error: 'DISABLED' });

    let { code } = req.body;
    if (typeof code != 'string' || code.length < 16 || code.length > 24) return res.status(400).json({ error: 'MISSING_CODE' });

    code = code.replaceAll('-', '').toLowerCase();

    try {

        await doTransaction(async (connection, commit) => {

            const [[giftCard]] = await connection.query('SELECT id, amount, usd FROM giftCards WHERE code = ? AND redeemedAt IS NULL FOR UPDATE', [code]);
            if (!giftCard) return res.status(400).json({ error: 'INVALID_CODE' });
        
            const [[user]] = await connection.query('SELECT id, username, balance FROM users WHERE id = ? FOR UPDATE', [req.userId]);
            await connection.query('UPDATE giftCards SET redeemedAt = NOW(), redeemedBy = ? WHERE id = ?', [user.id, giftCard.id]);
        
            let amount = giftCard.usd ? roundDecimal((giftCard.amount / cryptoData.robuxRate.usd) * cryptoData.robuxRate.robux) : giftCard.amount;
            const [txResult] = await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [user.id, amount, 'deposit', 'giftcard', giftCard.id]);
            
            if (depositBonus) {
                const bonus = roundDecimal(amount * depositBonus);
                await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [req.userId, bonus, 'in', 'deposit-bonus', txResult.insertId]);
                amount = roundDecimal(amount + bonus);
            }
            
            await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, user.id]);
            await newNotification(user.id, 'deposit-completed', { txId: txResult.insertId, amount }, connection);

            await commit();
            io.to(user.id).emit('balance', 'set', roundDecimal(user.balance + amount));
        
            sendLog('giftCards', `*${user.username}* (\`${user.id}\`) redeemed a :robux: R$${amount}${giftCard.usd ? ` ($${giftCard.amount}usd)` : ''} gift card: \`${code}\``);
            res.json({ success: true });

        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

});

module.exports = router;
