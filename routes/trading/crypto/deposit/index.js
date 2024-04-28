const express = require('express');
const router = express.Router();

const crypto = require('crypto');

const { sql, doTransaction } = require('../../../../database');
const io = require('../../../../socketio/server');

const { isAuthed, apiLimiter } = require('../../../auth/functions');
const { cryptoData, coinpayments } = require('./functions');
const { enabledFeatures, depositBonus } = require('../../../admin/config');
const { roundDecimal, sendLog, newNotification } = require('../../../../utils');

router.get('/', async (req, res) => {
    res.json({
        currencies: Object.values(cryptoData.currencies).map(currency => ({
            id: currency.id,
            name: currency.name,
            price: currency.price,
            confirmations: currency.confirmations
        })),
        robuxRate: cryptoData.robuxRate
    });
});

const resultsPerPage = 50;

router.get('/transactions', isAuthed, async (req, res) => {

    let page = parseInt(req.query.page);
    page = !isNaN(page) && page > 0 ? page : 1;

    const offset = (page - 1) * resultsPerPage;

    const [[{ total }]] = await sql.query('SELECT COUNT(*) as total FROM cryptoDeposits WHERE userId = ?', [req.userId]);
    if (!total) return res.json({ page: 1, pages: 0, total: 0, data: [] });

    const pages = Math.ceil(total / resultsPerPage);

    if (page > pages) return res.status(404).json({ error: 'PAGE_NOT_FOUND' });
    const [data] = await sql.query('SELECT txId, currency, cryptoAmount, fiatAmount, robuxAmount, status, createdAt, modifiedAt FROM cryptoDeposits WHERE userId = ? ORDER BY id DESC LIMIT ? OFFSET ?', [req.userId, resultsPerPage, offset]);
    
    res.json({
        page,
        pages,
        total,
        data
    });

});

router.use((req, res, next) => {
    if (!enabledFeatures.cryptoDeposits) return res.status(400).json({ error: 'DISABLED' });
    next();
});

router.post('/wallet', isAuthed, apiLimiter, async (req, res) => {

    const currencyId = req.body.currency;

    const currency = cryptoData.currencies[currencyId];
    if (!currency) return res.status(400).json({ error: 'INVALID_CURRENCY' });

    try {

        const [[wallet]] = await sql.query('SELECT address FROM cryptoWallets WHERE userId = ? AND currency = ?', [req.userId, currencyId]);
        let address = wallet?.address;
    
        if (!address) {
            
            const newWallet = await coinpayments.getCallbackAddress({
                currency: currencyId
            });
    
            address = newWallet.address;
            if (!address) return res.status(500).json({ error: 'INTERNAL_ERROR' });
            
            await sql.query('INSERT INTO cryptoWallets (userId, currency, address) VALUES (?, ?, ?)', [req.userId, currencyId, address]);
    
        }

        res.json({
            robuxRate: cryptoData.robuxRate,
            currency,
            address
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

});

router.post('/ipn', async (req, res) => {

    const raw = req.rawUrlBody?.toString();
    // console.log('incoming ipn', raw);

    if (!raw) return res.sendStatus(500);

    const calcHmac = crypto
    .createHmac(`sha512`, process.env.COINPAYMENTS_IPN_SECRET)
    .update(raw)
    .digest(`hex`);
    
    if (calcHmac != req.header("HMAC")) {
        console.log('Invalid event signature received');
        return res.sendStatus(403);
    }

    const event = req.body;
    // console.log('new event', event)

    if (event.ipn_type != 'deposit') {
        console.log('Invalid event type received', event.ipn_type);
        return res.sendStatus(200);
    }

    const currency = cryptoData.currencies[event.currency];
    if (!currency) {
        console.log('Invalid event currency received', event.currency);
        return res.sendStatus(200);
    }

    const status = event.status < 0 ? 'failed' : event.status < 100 ? 'pending' : 'completed';

    // turn the crypto amount into usd and then robux
    const usd = event.amount * currency.price;
    let robux = Math.floor(usd * cryptoData.robuxRate.robux / cryptoData.robuxRate.usd);
    
    if (robux < 0.01) {
        console.log('Invalid event amount received');
        return res.sendStatus(200);
    }

    try {

        await doTransaction(async (connection, commit) => {

            let [[exists]] = await connection.query('SELECT id, userId FROM cryptoDeposits WHERE txId = ? AND currency = ? FOR UPDATE', [event.txn_id, currency.id]);
            let userId = exists?.userId;
            let depositId = exists?.id;

            if (!depositId) {

                const [[wallet]] = await connection.query('SELECT userId FROM cryptoWallets WHERE address = ? AND currency = ?', [event.address, currency.id]);

                if (!wallet) {
                    console.log('Invalid event wallet received');
                    return res.sendStatus(200);
                }

                userId = wallet.userId;

                const [result] = await connection.query('INSERT INTO cryptoDeposits (userId, currency, cryptoAmount, fiatAmount, robuxAmount, txId, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, currency.id, event.amount, usd, robux, event.txn_id, status]);
                depositId = result.insertId;

                if (status != 'completed') {
                    io.to(userId).emit('toast', 'success', `Your crypto deposit for R$${robux} has been detected and it\'s awaiting confirmation.`, { duration: 30000 });
                    sendLog('cryptoDeposits', `New pending crypto deposit from *${userId}* - :robux: R$${robux} (#${depositId})`);
                }

            } else {
                await connection.query('UPDATE cryptoDeposits SET status = ?, robuxAmount = ?, fiatAmount = ? WHERE id = ?', [status, robux, usd, depositId]);
            }

            if (status != 'completed') {
                await commit();
                return res.sendStatus(200);
            }
            
            // if (!exists) [[exists]] = await connection.query('SELECT id, userId FROM cryptoDeposits WHERE txId = ? AND currency = ?', [event.txn_id, currency.id]);
            const [txResult] = await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [userId, robux, 'deposit', 'crypto', depositId]);

            if (depositBonus) {
                const bonus = roundDecimal(robux * depositBonus);
                await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [userId, bonus, 'in', 'deposit-bonus', txResult.insertId]);
                robux = roundDecimal(robux + bonus);
            }

            await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [robux, userId]);        
            await newNotification(userId, 'deposit-completed', { txId: txResult.insertId, amount: robux }, connection);

            await commit();
            res.sendStatus(200);

            io.to(userId).emit('balance', 'add', robux);
            io.to(userId).emit('toast', 'success', `Your deposit of R$${robux} has been completed.`);

            sendLog('cryptoDeposits', `Crypto deposit from *${userId}* confirmed - :robux: R$${robux} (#${depositId}). \`$${roundDecimal(usd)}usd\`${currency.explorer ? `\n${currency.explorer.replace('%txid%', event.txn_id)}` : ''}`);

        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

});


module.exports = router;
