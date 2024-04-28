const express = require('express');
const router = express.Router();

const { doTransaction } = require('../../../database');

const { isAuthed, apiLimiter } = require('../../auth/functions');
const { roundDecimal, xpChanged } = require('../../../utils');
const io = require('../../../socketio/server');
const { jackpot, startCountdown, makeBotJoin } = require('./functions');
const { enabledFeatures, xpMultiplier } = require('../../admin/config');

router.use((req, res, next) => {
    if (!enabledFeatures.jackpot) return res.status(400).json({ error: 'DISABLED' });
    next();
});

router.post('/join', isAuthed, apiLimiter, async (req, res) => {
    joinJackpot(req, res);
});

async function joinJackpot(req, res) {

    if (jackpot.round.EOSBlock) return res.json({ error: 'ALREADY_STARTED' });

    const amount = roundDecimal(req.body.amount) || 0;

    if (isNaN(amount)) {
        return res.json({ error: 'INVALID_AMOUNT' });
    } else if (amount < jackpot.config.minBet) {
        return res.json({ error: 'MIN_BET_JACKPOT' });
    }

    try {

        await doTransaction(async (connection, commit) => {

            const [[user]] = await connection.query('SELECT id, username, role, sponsorLock, balance, xp, anon FROM users WHERE id = ? FOR UPDATE', [req.userId]);
            if (user.sponsorLock) return res.json({ error: 'SPONSOR_LOCK' });

            if (user.balance < amount) {
                return res.json({ error: 'INSUFFICIENT_BALANCE' });
            }

            let userBets = 0;
            let userIds = [];

            for (const bet of jackpot.bets) {
                if (bet.user.id == req.userId) {
                    userBets += bet.amount;
                }
                userIds.push(bet.user.id);
            }
        
            if (userBets + amount > jackpot.config.maxBet) {
                return res.json({ error: 'MAX_BET_JACKPOT' });
            }

            const xp = roundDecimal(amount * xpMultiplier);
            await connection.query('UPDATE users SET balance = balance - ?, xp = xp + ? WHERE id = ?', [amount, xp, req.userId]);
            await connection.query('SELECT id FROM jackpot WHERE id = ? FOR UPDATE', [jackpot.round.id]);

            const ticketsFrom = jackpot.round.amount * 100;
            const ticketsTo = ticketsFrom + (amount * 100) - 1;

            const [jackpotBetResult] = await connection.query('INSERT INTO jackpotBets (userId, jackpotId, amount, ticketsFrom, ticketsTo) VALUES (?, ?, ?, ?, ?)', [user.id, jackpot.round.id, amount, ticketsFrom, ticketsTo]);
            const [betResult] = await connection.query('INSERT INTO bets (userId, amount, edge, game, gameId, completed) VALUES (?, ?, ?, ?, ?, ?)', [user.id, amount, roundDecimal(amount * 0.05), 'jackpot', jackpotBetResult.insertId, false]);

            jackpot.round.amount = roundDecimal(jackpot.round.amount + amount);
            await connection.query('UPDATE jackpot SET amount = ? WHERE id = ?', [jackpot.round.amount, jackpot.round.id]);

            await xpChanged(user.id, user.xp, roundDecimal(user.xp + xp), connection);
            await commit();

            io.to(user.id).emit('balance', 'set', roundDecimal(user.balance - amount));

            const bet = {
                id: jackpotBetResult.insertId,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    xp: user.xp,
                    anon: user.anon
                },
                ticketsFrom,
                ticketsTo,
                amount
            };
        
            jackpot.bets.push(bet);
            userIds.push(user.id);

            const uniquePlayers = [...new Set(userIds)];
            if (uniquePlayers.length >= jackpot.config.minPlayers) {
                startCountdown();
            } else if (jackpot.bets.length == 1) {
                const jackpotId = jackpot.round.id;
                setTimeout(() => {
                    
                    if (jackpot.round.id != jackpotId) return;
                    if (jackpot.round.countStartedAt) return;
                    makeBotJoin();

                }, 60000);
            }
            
            io.to('jackpot').emit('jackpot:bets', [bet]);
            res.json({ success: true });    

        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

}

module.exports = router;