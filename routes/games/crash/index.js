const express = require('express');
const router = express.Router();

const { doTransaction } = require('../../../database');

const { isAuthed, apiLimiter } = require('../../auth/functions');
const { roundDecimal, xpChanged } = require('../../../utils');
const io = require('../../../socketio/server');
const { crash } = require('./functions')
const { newBets } = require('../../../socketio/bets');
const { enabledFeatures, xpMultiplier } = require('../../admin/config');

// const clientSeed = '00000000000000000003e5a54c2898a18d262eb5860e696441f8a4ebbff03697'; // btc block hash

router.use((req, res, next) => {
    if (!enabledFeatures.crash) return res.status(400).json({ error: 'DISABLED' });
    next();
});

router.post('/bet', isAuthed, apiLimiter, async (req, res) => {

    if (crash.round.startedAt) return res.json({ error: 'ALREADY_STARTED' });
    if (crash.bets.find(bet => bet.user.id === req.userId)) return res.json({ error: 'ALREADY_JOINED' });

    const amount = roundDecimal(req.body.amount);

    if (!amount || amount < 1 || amount > 25000) {
        return res.json({ error: 'INVALID_AMOUNT' });
    }

    const autoCashoutPoint = req.body.autoCashoutPoint ? roundDecimal(req.body.autoCashoutPoint) : null;

    if (autoCashoutPoint && (autoCashoutPoint < 1.01 || autoCashoutPoint > 100000 || isNaN(autoCashoutPoint))) {
        return res.json({ error: 'INVALID_CASHOUT' });
    }

    try {

        await doTransaction(async (connection, commit) => {

            const [[user]] = await connection.query('SELECT id, username, role, balance, xp, anon FROM users WHERE id = ? FOR UPDATE', [req.userId]);

            if (user.balance < amount) {
                return res.json({ error: 'INSUFFICIENT_BALANCE' });
            }
    
            const xp = roundDecimal(amount * xpMultiplier);
            await connection.query('UPDATE users SET balance = balance - ?, xp = xp + ? WHERE id = ?', [amount, xp, req.userId]);
    
            const [crashBetResult] = await connection.query('INSERT INTO crashBets (userId, roundId, amount, autoCashoutPoint) VALUES (?, ?, ?, ?)', [user.id, crash.round.id, amount, autoCashoutPoint]);
            const [betResult] = await connection.query('INSERT INTO bets (userId, amount, edge, game, gameId, completed) VALUES (?, ?, ?, ?, ?, ?)', [user.id, amount, roundDecimal(amount * 0.075), 'crash', crashBetResult.insertId, false]);

            await xpChanged(user.id, user.xp, roundDecimal(user.xp + xp), connection);
            await commit();
        
            io.to(user.id).emit('balance', 'set', roundDecimal(user.balance - amount));

            const bet = {
                id: crashBetResult.insertId,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    xp: user.xp,
                    anon: user.anon
                },
                cashoutPoint: null,
                amount
            };
    
            io.to('crash').emit('crash:bets', [bet]);
            bet.user.anon = user.anon;
            bet.autoCashoutPoint = autoCashoutPoint;
    
            crash.bets.push(bet);
        
            res.json({ success: true });

        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }


});

router.post('/cashout', isAuthed, apiLimiter, async (req, res) => {

    if (!crash.round.startedAt) return res.json({ error: 'NOT_STARTED' });
    if (crash.round.endedAt) return res.json({ error: 'ALREADY_ENDED' });

    const bet = crash.bets.find(bet => bet.user.id === req.userId);
    if (!bet) return res.json({ error: 'NOT_JOINED' });

    const currentPoint = crash.round.currentMultiplier;
    
    if (!currentPoint || currentPoint < 1.01) return res.json({ error: 'INVALID_CASHOUT' });
    if (bet.cashoutPoint || (bet.autoCashoutPoint && (currentPoint >= bet.autoCashoutPoint))) return res.json({ error: 'ALREADY_CASHED_OUT' });

    bet.cashoutPoint = currentPoint;
    const winnings = roundDecimal(bet.amount * currentPoint);
    bet.winnings = winnings > crash.config.maxProfit ? crash.config.maxProfit : winnings;

    try {

        const user = await doTransaction(async (connection, commit) => {

            const [[user]] = await connection.query('SELECT id, username, balance, xp, anon FROM users WHERE id = ?', [req.userId]);

            await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [bet.winnings, user.id]);
            await connection.query('UPDATE bets SET completed = 1, winnings = ? WHERE game = ? AND gameId = ?', [bet.winnings, 'crash', bet.id]);

            await commit();
            return user;

        });

        io.to(user.id).emit('balance', 'set', roundDecimal(user.balance + bet.winnings));

        io.to('crash').emit('crash:cashout', {
            id: bet.id,
            cashoutPoint: currentPoint,
            winnings: bet.winnings
        });
    
        newBets([{
            user: user,
            amount: bet.amount,
            edge: roundDecimal(bet.amount * 0.075),
            payout: bet.winnings,
            game: 'crash'
        }]);
    
        res.json({ success: true });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

});

module.exports = router;