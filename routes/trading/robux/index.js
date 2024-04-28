const express = require('express');
const router = express.Router();

const { isAuthed, apiLimiter } = require('../../auth/functions');
const { roundDecimal, sendLog } = require('../../../utils');
const { getCurrentUser } = require('../../../utils/roblox');
const { sql, doTransaction } = require('../../../database');
const { enabledFeatures, checkAccountLock } = require('../../admin/config');
const { robuxExchange, processQueue } = require('./functions');

const io = require('../../../socketio/server');

router.post('/deposit', [isAuthed, apiLimiter], async (req, res) => {

    if (!enabledFeatures.robuxDeposits) return res.status(400).json({ error: 'DISABLED' });

    const amount = req.body.amount;
    if (!Number.isInteger(amount)) return res.status(400).json({ error: 'INVALID_AMOUNT' });

    if (amount < 10) return res.status(400).json({ error: 'MIN_ROBUX_DEPOSIT' });
    if (amount > 100000) return res.status(400).json({ error: 'AMOUNT_TOO_HIGH' });

    const [[user]] = await sql.query('SELECT id, username, robloxCookie, proxy, balance FROM users WHERE id = ?', [req.userId]);

    const robloxUser = await getCurrentUser(user.robloxCookie, user.proxy);
    if (!robloxUser) return res.status(401).json({ error: 'INVALID_ROBLOX_COOKIE' });

    const [[{ pendingWithdraw }]] = await sql.query('SELECT SUM(totalAmount) as pendingWithdraw FROM robuxExchanges WHERE userId = ? AND operation = ? AND status = ?', [user.id, 'deposit', 'pending']);
    if (robloxUser.RobuxBalance < amount + pendingWithdraw) return res.status(400).json({ error: 'INSUFFICIENT_BALANCE' });

    const [result] = await sql.query('INSERT INTO robuxExchanges (userId, totalAmount, operation) VALUES (?, ?, ?)', [user.id, amount, 'deposit']);
    const id = result.insertId;

    const [txsQueue] = await sql.query('SELECT id FROM robuxExchanges WHERE status = ? AND operation = ? ORDER BY id ASC', ['pending', 'deposit']); 
    const queuePosition = txsQueue.findIndex(x => x.id === id);

    sendLog('robuxExchange', `New robux deposit in queue from *${user.username}* (\`${user.id}\`) - :robux: R$${amount} (#${id})`);
    if (!robuxExchange.queue.size) robuxExchange.queue.add(processQueue);

    res.json({
        "id": id,
        "filledAmount": 0,
        "totalAmount": amount,
        "status": "pending",
        "operation": "deposit",
        "createdAt": new Date(),
        "modifiedAt": null,
        "queuePosition": queuePosition
    });

});

const maxUnfilled = 25000;

router.post('/withdraw', [isAuthed, apiLimiter], async (req, res) => {

    if (!enabledFeatures.robuxWithdrawals) return res.status(400).json({ error: 'DISABLED' });

    const amount = req.body.amount;
    if (!Number.isInteger(amount)) return res.status(400).json({ error: 'INVALID_AMOUNT' });

    if (amount < 50) {
        return res.status(400).json({ error: 'MIN_WITHDRAW_ROBUX' });
    } else if (amount > maxUnfilled) {
        return res.status(400).json({ error: 'MAX_UNFILLED' });
    }

    const [[{ robloxCookie, proxy }]] = await sql.query('SELECT robloxCookie, proxy FROM users WHERE id = ?', [req.userId]);

    const robloxUser = await getCurrentUser(robloxCookie, proxy);
    if (!robloxUser) return res.status(401).json({ error: 'INVALID_ROBLOX_COOKIE' });

    try {

        await doTransaction(async (connection, commit) => {

            const [[user]] = await connection.query('SELECT id, xp, username, robloxCookie, proxy, balance, accountLock, sponsorLock, verified, perms FROM users WHERE id = ? FOR UPDATE', [req.userId]);
            if (user.balance < amount) return res.status(400).json({ error: 'INSUFFICIENT_BALANCE' });
    
            user.accountLock = await checkAccountLock(user);
            if (user.accountLock || user.sponsorLock) return res.status(400).json({ error: 'ACCOUNT_LOCKED' });
    
            if (user.perms < 2) {
                if (user.xp < 5000) return res.status(400).json({ error: 'INSUFFICIENT_XP' });
    
                const [[lastWeekDeposits]] = await connection.query('SELECT COALESCE(SUM(amount), 0) as sum FROM transactions WHERE userId = ? AND type = ? AND createdAt > ?', [user.id, 'deposit', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)]);
                if (lastWeekDeposits.sum < 200) return res.status(400).json({ error: 'INSUFFICIENT_DEPOSITS' });
        
                const [[totalDeposits]] = await connection.query('SELECT COALESCE(SUM(amount), 0) as sum FROM transactions WHERE userId = ? AND type = ?', [user.id, 'deposit']);
                const [[userWagered]] = await connection.query('SELECT COALESCE(SUM(amount), 0) AS sum FROM bets WHERE userId = ? AND completed = 1', [user.id]);
                if (totalDeposits.sum > userWagered.sum) return res.status(400).json({ error: 'NOT_ENOUGH_WAGERED_WITHDRAW' });
    
                const [[lastDeposit]] = await connection.query('SELECT amount, createdAt FROM transactions WHERE userId = ? AND type = ? ORDER BY id DESC LIMIT 1', [user.id, 'deposit']);
                const [[wageredSinceLastDeposit]] = await connection.query('SELECT COALESCE(SUM(amount), 0) AS sum FROM bets WHERE userId = ? AND completed = 1 AND createdAt > ?', [user.id, lastDeposit.createdAt]);
                if (lastDeposit.amount > wageredSinceLastDeposit.sum) return res.status(400).json({ error: 'NOT_ENOUGH_WAGERED_WITHDRAW' });

                const [[unfilledQueue]] = await connection.query('SELECT COALESCE(SUM(totalAmount - filledAmount), 0) as sum FROM robuxExchanges WHERE userId = ? AND operation = ? AND status = ?', [user.id, 'withdraw', 'pending']);
                if (unfilledQueue.sum + amount > maxUnfilled) return res.status(400).json({ error: 'MAX_UNFILLED' });
            }
    
            await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, user.id]);
    
            const [result] = await connection.query('INSERT INTO robuxExchanges (userId, totalAmount, operation) VALUES (?, ?, ?)', [user.id, amount, 'withdraw']);
            const id = result.insertId;
    
            const [txsQueue] = await connection.query('SELECT id FROM robuxExchanges WHERE status = ? AND operation = ? ORDER BY createdAt ASC', ['pending', 'withdraw']); 
            const queuePosition = txsQueue.findIndex(x => x.id === id);
    
            await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [user.id, 0, 'withdraw', 'robux', result.insertId]);
            await commit();
    
            io.to(user.id).emit('balance', 'set', roundDecimal(user.balance - amount));
            if (!robuxExchange.queue.size) robuxExchange.queue.add(processQueue);
            sendLog('robuxExchange', `New robux withdraw in queue from *${user.username}* (\`${user.id}\`) - :robux: R$${amount} (#${id})`);

            res.json({
                "id": id,
                "filledAmount": 0,
                "totalAmount": amount,
                "status": "pending",
                "operation": "withdraw",
                "createdAt": new Date(),
                "modifiedAt": null,
                "queuePosition": queuePosition
            });

        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }

});

const resultsPerPage = 100;

router.get('/transactions', isAuthed, async (req, res) => {
    
    let page = parseInt(req.query.page);
    page = !isNaN(page) && page > 0 ? page : 1;

    const offset = (page - 1) * resultsPerPage;

    const [[{ total }]] = await sql.query('SELECT COUNT(*) as total FROM robuxExchanges WHERE userId = ?', [req.userId]);
    if (!total) return res.json({ page: 1, pages: 0, total: 0, data: [] });

    const pages = Math.ceil(total / resultsPerPage);

    if (page > pages) return res.status(404).json({ error: 'PAGE_NOT_FOUND' });
    const [data] = await sql.query('SELECT id, filledAmount, totalAmount, status, operation, createdAt, modifiedAt FROM robuxExchanges WHERE userId = ? ORDER BY id DESC LIMIT ? OFFSET ?', [req.userId, resultsPerPage, offset]);

    data.forEach(e => {

        if (e.status === 'pending') {
            const queuePosition = robuxExchange.transactions.findIndex(x => x.status == e.status && x.id === e.id);
            if (queuePosition >= 0) e.queuePosition = queuePosition;
        }

        // if (e.createdAt == e.modifiedAt) delete e.modifiedAt;

    });

    res.json({
        page,
        pages,
        total,
        data
    });

});

router.post('/cancel/:id', [isAuthed, apiLimiter], async (req, res) => {

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'INVALID_ID' });

    try {

        await doTransaction(async (connection, commit) => {
                
            const [[transaction]] = await connection.query('SELECT id, userId, status, operation, totalAmount, filledAmount FROM robuxExchanges WHERE id = ? FOR UPDATE', [id]);

            if (!transaction) return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' });
            if (transaction.userId != req.userId) return res.status(403).json({ error: 'TRANSACTION_NOT_FOUND' });
            if (transaction.status != 'pending') return res.status(400).json({ error: 'TRANSACTION_NOT_PENDING' });

            if (robuxExchange.currentTransactions.includes(id)) return res.status(400).json({ error: 'TRANSACTION_IN_PROGRESS' });
            const queueTransaction = robuxExchange.transactions.find(x => x.id === id);
        
            if (queueTransaction) {
                queueTransaction.status = 'cancelled';
                queueTransaction.modifiedAt = Date.now();
            }

            const unfilledAmount = transaction.totalAmount - transaction.filledAmount;

            if (unfilledAmount && transaction.operation == 'withdraw') {
                await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [unfilledAmount, transaction.userId]);
                // await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [transaction.userId, unfilledAmount, 'in', 'robux-cancel', id]);
                io.to(transaction.userId).emit('balance', 'add', unfilledAmount);
            }
        
            await connection.query('UPDATE robuxExchanges SET status = ? WHERE id = ?', ['cancelled', id]);
            await commit();

            res.json({ success: true });
            sendLog('robuxExchange', `Robux exchange cancelled by \`${req.userId}\` - :robux:R$${unfilledAmount} ${transaction.operation} (#${id})`);
        
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }

});

module.exports = router;