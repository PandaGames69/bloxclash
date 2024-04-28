const express = require('express');
const router = express.Router();

const { sql, doTransaction } = require('../../../database');
const { robuxExchange } = require('../../trading/robux/functions');
const { sendLog } = require('../../../utils');
const io = require('../../../socketio/server');

const cryptoRoute = require('./crypto');
router.use('/crypto', cryptoRoute);

const resultsPerPage = 10;

router.get('/', async (req, res) => {

    const [[{ totalDeposits, totalWithdraws }]] = await sql.query(`
        SELECT 
            COALESCE(SUM(CASE WHEN operation = 'deposit' THEN totalAmount - filledAmount ELSE 0 END), 0) as totalDeposits,
            COALESCE(SUM(CASE WHEN operation = 'withdraw' THEN totalAmount - filledAmount ELSE 0 END), 0) as totalWithdraws
        FROM 
            robuxExchanges 
        WHERE 
            status = 'pending'
    `);

    res.json({
        totalDeposits,
        totalWithdraws
    })

});

router.get('/transactions', async (req, res) => {

    const sortBy = req.query.sortBy || 'id';
    if (!['totalAmount', 'id'].includes(sortBy)) return res.status(400).json({ error: 'INVALID_SORT_BY' });

    const sortOrder = req.query.sortOrder || 'ASC';
    if (!['ASC', 'DESC'].includes(sortOrder)) return res.status(400).json({ error: 'INVALID_SORT_ORDER' });

    let searchQuery = 'WHERE status = ?';
    let searchArgs = ['pending'];

    const search = req.query.search;
    if (search) {
        if (typeof search !== 'string' || search.length < 1 || search.length > 30) return res.status(400).json({ error: 'INVALID_SEARCH' });
        searchQuery += ` AND LOWER(username) LIKE ?`;
        searchArgs.push(`%${search.toLowerCase()}%`);
    }

    let page = parseInt(req.query.page);
    page = !isNaN(page) && page > 0 ? page : 1;

    const offset = (page - 1) * resultsPerPage;

    const [[{ total }]] = await sql.query(`SELECT COUNT(*) as total FROM robuxExchanges JOIN users ON users.id = robuxExchanges.userId ${searchQuery}`, searchArgs);
    if (!total) return res.json({ page: 1, pages: 0, total: 0, data: [] });

    const pages = Math.ceil(total / resultsPerPage);

    if (page > pages) return res.status(404).json({ error: 'PAGE_NOT_FOUND' });

    const [data] = await sql.query(
        `
        SELECT
            robuxExchanges.id,
            users.id as userId,
            users.username,
            users.role,
            users.xp,
            robuxExchanges.operation,
            robuxExchanges.status,
            robuxExchanges.filledAmount,
            robuxExchanges.totalAmount,
            robuxExchanges.createdAt
        FROM
            robuxExchanges
        JOIN
            users ON users.id = robuxExchanges.userId
        ${searchQuery} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?;
       `,
        searchArgs.concat([resultsPerPage, offset])
    );
    
    res.json({
        page,
        pages,
        total,
        data
    });
    
});

router.post('/remove/:id', async (req, res) => {

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'INVALID_ID' });

    try {

        await doTransaction(async (connection, commit, rollback) => {
            
            const [[transaction]] = await connection.query('SELECT id, userId, status, operation, totalAmount, filledAmount FROM robuxExchanges WHERE id = ? FOR UPDATE', [id]);

            if (!transaction) return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' });
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
                // await connection.query('UPDATE transactions SET amount = ? WHERE type = ? AND method = ? AND methodId = ?', [unfilledAmount, 'withdraw', 'robux', transaction.id]);
                // await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [transaction.userId, unfilledAmount, 'in', 'robux-cancel', id]);
                io.to(transaction.userId).emit('balance', 'add', unfilledAmount);
            }
    
            await connection.query('UPDATE robuxExchanges SET status = ? WHERE id = ?', ['cancelled', id]);
            await commit();
    
            sendLog('admin', `Robux exchange cancelled by *${req.user.username}* (\`${req.userId}\`) - :robux:R$${unfilledAmount} ${transaction.operation} (#${id})`);
            res.json({ success: true });

        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }

});

router.post('/createGiftCards', async (req, res) => {

    const quantity = parseInt(req.body.quantity);
    if (!quantity || isNaN(quantity)) return res.status(400).json({ error: 'MISSING_QUANTITY' });

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) return res.status(400).json({ error: 'INVALID_QUANTITY' });

    const amount = parseInt(req.body.amount);
    if (!amount || isNaN(amount)) return res.status(400).json({ error: 'MISSING_AMOUNT' });

    if (amount < 1 || amount > 1000) return res.status(400).json({ error: 'INVALID_AMOUNT' });

    const values = [];
    const codes = [];

    for (let i = 0; i < quantity; i++) {
        const code = [...Array(16)].map(i=>(~~(Math.random()*36)).toString(36)).join('').match(/.{1,4}/g);
        values.push([code.join('').toLowerCase(), amount, 1]);
        codes.push(code.join('-').toUpperCase());
    }

    await sql.query('INSERT INTO giftCards (code, amount, usd) VALUES ?', [values]);

    sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* created \`${quantity}\` gift cards of $\`${amount}\`usd each`);
    res.json({ success: true, codes, amount });

});

module.exports = router;