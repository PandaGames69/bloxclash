

const express = require('express');
const router = express.Router();

const axios = require('axios');
const { sql, doTransaction } = require('../../../database');
const { sendLog, sleep, formatConsoleError } = require('../../../utils');
const { mexc, defaultCurrency, defaultCurrencyPrice } = require('../../trading/crypto/withdraw/functions');
const io = require('../../../socketio/server');

const resultsPerPage = 10;

const privateMexc = axios.create({
    baseURL: 'https://www.mexc.com/api/platform',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MEXC/1 CFNetwork/1331.0.7 Darwin/21.4.0',
        'Cookie': 'u_id=' + process.env.MEXC_APP_TOKEN
    }
});

router.get('/', async (req, res) => {

    const sortBy = req.query.sortBy || 'id';
    if (!['robuxAmount', 'id'].includes(sortBy)) return res.status(400).json({ error: 'INVALID_SORT_BY' });

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

    const [[{ total }]] = await sql.query(`SELECT COUNT(*) as total FROM cryptoWithdraws JOIN users ON users.id = cryptoWithdraws.userId ${searchQuery}`, searchArgs);
    if (!total) return res.json({ page: 1, pages: 0, total: 0, data: [] });

    const pages = Math.ceil(total / resultsPerPage);

    if (page > pages) return res.status(404).json({ error: 'PAGE_NOT_FOUND' });

    const [data] = await sql.query(
        `
        SELECT
            cryptoWithdraws.id,
            users.id as userId,
            users.username,
            users.role,
            users.xp,
            cryptoWithdraws.status,
            cryptoWithdraws.robuxAmount,
            cryptoWithdraws.fiatAmount,
            cryptoWithdraws.currency,
            cryptoWithdraws.chain,
            cryptoWithdraws.address,
            cryptoWithdraws.createdAt
        FROM
            cryptoWithdraws
        JOIN
            users ON users.id = cryptoWithdraws.userId
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

router.post('/accept/:id', async (req, res) => {

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'INVALID_ID' });

    let transaction;

    try {

        await doTransaction(async (connection, commit, rollback) => {

            [[transaction]] = await connection.query('SELECT id, currency, chain, address, robuxAmount, fiatAmount, status FROM cryptoWithdraws WHERE id = ? FOR UPDATE', [id]);

            if (!transaction) return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' });
            if (transaction.status != 'pending') return res.status(400).json({ error: 'TRANSACTION_NOT_PENDING' });

            await connection.query('UPDATE cryptoWithdraws SET status = ? WHERE id = ?', ['sending', id]);
            await commit();

        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }

    if (transaction.currency != defaultCurrency) {

        try {

            const { data: tradeRes } = await privateMexc({
                url: '/spot/v4/order/place',
                method: 'POST',
                data: {
                    "currency": transaction.currency,
                    "market": defaultCurrency,
                    "tradeType": "BUY",
                    "orderType": "MARKET_ORDER",
                    "amount": transaction.fiatAmount.toString()
                }
            });
    
            if (tradeRes.code != 200) {
                console.log(`TradeRes is not 200`, tradeRes);
                return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
            }
    
            for (let i = 0; i < 3; i++) {
    
                const { data: orderDetail } = await privateMexc({
                    url: '/spot/order/deal/detail',
                    params: {
                        "orderId": tradeRes.data,
                        "orderType": "MARKET_ORDER"
                    }
                });
    
                if (orderDetail.data?.state == 'FILLED') {
                    transaction.cryptoAmount = orderDetail.data.dealQuantity;
                    break;
                }
    
                console.log(`OrderDetail is not FILLED`, orderDetail);
                await sleep(500);
    
            }

        } catch (e) {
            console.error(formatConsoleError(e));
        } finally {
            if (!transaction.cryptoAmount) {
                await sql.query('UPDATE cryptoWithdraws SET status = ? WHERE id = ?', ['failed', id]);
                return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
            }
        }

    } else {
        transaction.cryptoAmount = transaction.fiatAmount / defaultCurrencyPrice;
    }
    
    try {

        const withdrawRes = await mexc({
            url: '/api/v3/capital/withdraw/apply',
            method: 'POST',
            sign: true,
            validateStatus: () => true,
            params: {
                coin: transaction.currency,
                network: transaction.chain,
                address: transaction.address,
                amount: transaction.cryptoAmount.toString()
            }
        });
    
        const withdrawId = withdrawRes.data.id;
    
        if (withdrawRes.status != 200 || !withdrawId) {
            console.log(`Error withdraw res`, withdrawRes.status, withdrawRes.data);
            await sql.query('UPDATE cryptoWithdraws SET status = ? WHERE id = ?', ['failed', id]);
            return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
        }
    
        await sql.query('UPDATE cryptoWithdraws SET exchangeId = ?, status = ? WHERE id = ?', [withdrawId, 'sent', id]);
        sendLog('cryptoWithdraws', `Withdraw #${id} was approved by *${req.user.username}* (\`${req.userId}\`) - :robux:R$${transaction.robuxAmount} (${transaction.fiatAmount}usd - ${transaction.cryptoAmount} ${transaction.currency})`);

        return res.json({ success: true });

    } catch (e) {
        console.error(formatConsoleError(e));
        await sql.query('UPDATE cryptoWithdraws SET status = ? WHERE id = ?', ['failed', id]);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }

});

router.post('/deny/:id', async (req, res) => {

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'INVALID_ID' });

    try {

        await doTransaction(async (connection, commit, rollback) => {

            const [[transaction]] = await connection.query('SELECT id, robuxAmount, userId, status FROM cryptoWithdraws WHERE id = ? FOR UPDATE', [id]);

            if (!transaction) return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' });
            if (transaction.status != 'pending') return res.status(400).json({ error: 'TRANSACTION_NOT_PENDING' });

            await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [transaction.robuxAmount, transaction.userId]);
            await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [transaction.userId, transaction.robuxAmount, 'in', 'crypto-cancel', id]);

            await connection.query('UPDATE cryptoWithdraws SET status = ? WHERE id = ?', ['denied', id]);
            await commit();

            io.to(transaction.userId).emit('balance', 'add', transaction.robuxAmount);
            sendLog('cryptoWithdraws', `Crypto withdraw rejected by *${req.user.username}* (\`${req.userId}\`) - :robux:R$${transaction.robuxAmount} (#${id})`);
            res.json({ success: true });

        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }

});

module.exports = router;