const express = require('express');
const router = express.Router();

// const crypto = require('crypto');
// const axios = require('axios');
const WAValidator = require('multicoin-address-validator');

const { sql, doTransaction } = require('../../../../database');
const io = require('../../../../socketio/server');

const { isAuthed, apiLimiter } = require('../../../auth/functions');
const { cryptoData } = require('../deposit/functions');
const { enabledFeatures, checkAccountLock } = require('../../../admin/config');
const { roundDecimal, sendLog } = require('../../../../utils');
const { withdrawalCoins, getWalletBalance, chainsConfig } = require('./functions');

router.get('/', async (req, res) => {

    let explorers = {};

    for (const [key, value] of Object.entries(chainsConfig)) {
        explorers[key] = value.explorer;
    }

    res.json({
        currencies: Object.values(withdrawalCoins),
        explorers,
        robuxRate: cryptoData.robuxRate
    });

});

const resultsPerPage = 50;

router.get('/transactions', isAuthed, async (req, res) => {

    let page = parseInt(req.query.page);
    page = !isNaN(page) && page > 0 ? page : 1;

    const offset = (page - 1) * resultsPerPage;

    const [[{ total }]] = await sql.query('SELECT COUNT(*) as total FROM cryptoWithdraws WHERE userId = ?', [req.userId]);
    if (!total) return res.json({ page: 1, pages: 0, total: 0, data: [] });

    const pages = Math.ceil(total / resultsPerPage);

    if (page > pages) return res.status(404).json({ error: 'PAGE_NOT_FOUND' });
    const [data] = await sql.query('SELECT id, txId, chain, currency, cryptoAmount, fiatAmount, robuxAmount, status, createdAt, modifiedAt FROM cryptoWithdraws WHERE userId = ? ORDER BY id DESC LIMIT ? OFFSET ?', [req.userId, resultsPerPage, offset]);
    
    res.json({
        page,
        pages,
        total,
        data
    });

});

const kycAmount = 150; // 150usd

router.post('/', isAuthed, apiLimiter, async (req, res) => {

    if (!enabledFeatures.cryptoWithdrawals) return res.status(400).json({ error: 'DISABLED' });

    const currency = withdrawalCoins[req.body.currency];
    if (!currency) return res.json({ error: 'INVALID_CURRENCY' });

    const chain = currency.chains.find(e => e.id == req.body.chain);
    if (!chain) return res.json({ error: 'INVALID_CHAIN' });

    if (typeof req.body.amount != 'number') return res.json({ error: 'INVALID_AMOUNT' });
    const robuxAmount = roundDecimal(req.body.amount);

    const fiatAmount = roundDecimal((robuxAmount / cryptoData.robuxRate.robux) * cryptoData.robuxRate.usd);
    const cryptoAmount = fiatAmount / currency.price;

    if (cryptoAmount < chain.min) return res.json({ error: 'MIN_CRYPTO_WITHDRAWAL' });
    if (cryptoAmount > chain.max) return res.json({ error: 'MAX_CRYPTO_WITHDRAWAL' });

    const address = req.body.address;
    if (typeof address !== 'string' || address.length < 2 || address.length > 128) return res.json({ error: 'INVALID_ADDRESS' });

    const chainConfig = chainsConfig[chain.id];
    if (!chainConfig) return res.json({ error: 'INVALID_CHAIN' });

    const isValid = WAValidator.validate(address, chainConfig.validator);
    if (!isValid) return res.json({ error: 'INVALID_ADDRESS' });
    // console.log(chain.id, validatorChainCurrencies[chain.id], isValid);

    const walletBalance = await getWalletBalance();

    try {

        await doTransaction(async (connection, commit) => {

            const [[user]] = await connection.query('SELECT id, xp, username, balance, accountLock, sponsorLock, verified, perms, cryptoAllowance FROM users WHERE id = ? FOR UPDATE', [req.userId]);
            if (user.balance < robuxAmount) return res.status(400).json({ error: 'INSUFFICIENT_BALANCE' });
    
            user.accountLock = await checkAccountLock(user);
            if (user.accountLock) return res.status(400).json({ error: 'ACCOUNT_LOCKED' });
            if (user.sponsorLock && user.cryptoAllowance == null) return res.status(400).json({ error: 'SPONSOR_LOCK' });
    
            if (user.cryptoAllowance != null && robuxAmount > user.cryptoAllowance) {
                return res.status(400).json({ error: 'EXCEEDED_MAX_CRYPTO' });
            }
    
            const vip = user.perms > 1 || user.sponsorLock;
            if (!vip) {
    
                if (user.xp < 5000) return res.status(400).json({ error: 'INSUFFICIENT_XP' });
    
                const [[lastWeekDeposits]] = await connection.query('SELECT COALESCE(SUM(amount), 0) as sum FROM transactions WHERE userId = ? AND type = ? AND createdAt > ?', [user.id, 'deposit', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)]);
                if (lastWeekDeposits.sum < 200) return res.status(400).json({ error: 'INSUFFICIENT_DEPOSITS' });
    
                const [[totalDeposits]] = await connection.query('SELECT COALESCE(SUM(amount), 0) as sum FROM transactions WHERE userId = ? AND type = ?', [user.id, 'deposit']);
                const [[userWagered]] = await connection.query('SELECT COALESCE(SUM(amount), 0) AS sum FROM bets WHERE userId = ? AND completed = 1', [user.id]);
                if (totalDeposits.sum > userWagered.sum) return res.status(400).json({ error: 'NOT_ENOUGH_WAGERED_WITHDRAW' });
    
                const [[lastDeposit]] = await connection.query('SELECT amount, createdAt FROM transactions WHERE userId = ? AND type = ? ORDER BY id DESC LIMIT 1', [user.id, 'deposit']);
                const [[wageredSinceLastDeposit]] = await connection.query('SELECT COALESCE(SUM(amount), 0) AS sum FROM bets WHERE userId = ? AND completed = 1 AND createdAt > ?', [user.id, lastDeposit.createdAt]);
                if (lastDeposit.amount > wageredSinceLastDeposit.sum) return res.status(400).json({ error: 'NOT_ENOUGH_WAGERED_WITHDRAW' });
    
            }
    
            const [[{ pendingWithdrawals }]] = await connection.query(`SELECT COUNT(*) as pendingWithdrawals FROM cryptoWithdraws WHERE userId = ? AND status = ?`, [user.id, 'pending']);
            if (pendingWithdrawals >= 1) return res.status(400).json({ error: 'PENDING_WITHDRAWAL' });
    
            const [[{ pendingSum }]] = await connection.query(`SELECT COALESCE(SUM(fiatAmount), 0) as pendingSum FROM cryptoWithdraws WHERE status = ?`, ['pending']);
            if (pendingSum + fiatAmount > walletBalance) return res.status(400).json({ error: 'HOT_WALLET_BALANCE' });
    
            if (!vip) {
                
                const [[{ todayCryptoDeposits }]] = await connection.query(`SELECT COALESCE(SUM(fiatAmount), 0) as todayCryptoDeposits FROM cryptoDeposits WHERE status = ? AND createdAt > ?`, ['completed', new Date(Date.now() - 24 * 60 * 60 * 1000)]);
                if (pendingSum + fiatAmount > todayCryptoDeposits * 0.5) return res.status(400).json({ error: 'HOT_WALLET_BALANCE' });
            
                if (!user.verified) {
                    if (fiatAmount > kycAmount) return res.status(400).json({ error: 'KYC' });
                    const [[{ userPreviousWithdrawals }]] = await connection.query(`SELECT COALESCE(SUM(fiatAmount), 0) as userPreviousWithdrawals FROM cryptoWithdraws WHERE userId = ? AND status = ?`, [user.id, 'completed']);
                    if (userPreviousWithdrawals + fiatAmount > kycAmount) return res.status(400).json({ error: 'KYC' });
                }
    
            }
    
            if (user.cryptoAllowance != null) {
                await connection.query('UPDATE users SET balance = balance - ?, cryptoAllowance = cryptoAllowance - ? WHERE id = ?', [robuxAmount, robuxAmount, user.id]);
            } else {
                await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [robuxAmount, user.id]);
            }
    
            const [txResult] = await connection.query('INSERT INTO cryptoWithdraws (userId, robuxAmount, fiatAmount, cryptoAmount, address, currency, chain, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [user.id, robuxAmount, fiatAmount, cryptoAmount, address, currency.id, chain.id, 'pending']);
            await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [user.id, robuxAmount, 'out', 'crypto', txResult.insertId]);
    
            io.to(user.id).emit('balance', 'set', roundDecimal(user.balance - robuxAmount));
            sendLog('cryptoWithdraws', `*${user.username}* (\`${user.id}\`) withdrew :robux: R$${robuxAmount} ($${fiatAmount}usd) to ${address} (${currency.name}).`);
    
            await commit();
            const now = new Date();
            
            res.json({
                success: true,
                transaction: {
                    "id": txResult.insertId,
                    "txId": null,
                    "chain": chain.id,
                    "currency": currency.id,
                    "cryptoAmount": cryptoAmount,
                    "fiatAmount": fiatAmount,
                    "robuxAmount": robuxAmount,
                    "status": "pending",
                    "createdAt": now,
                    "modifiedAt": now
                }
            });

        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

});

router.post('/cancel/:id', isAuthed, apiLimiter, async (req, res) => {

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'INVALID_ID' });

    try {

        await doTransaction(async (connection, commit) => {

            const [[transaction]] = await connection.query('SELECT cw.id, username, robuxAmount, userId, status FROM cryptoWithdraws cw JOIN users u ON u.id = cw.userId WHERE cw.id = ? AND userId = ? FOR UPDATE', [id, req.userId]);

            if (!transaction) return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' });
            if (transaction.status != 'pending') return res.status(400).json({ error: 'TRANSACTION_NOT_PENDING' });

            await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [transaction.robuxAmount, transaction.userId]);
            await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [transaction.userId, transaction.robuxAmount, 'in', 'crypto-cancel', id]);
            io.to(transaction.userId).emit('balance', 'add', transaction.robuxAmount);

            await connection.query('UPDATE cryptoWithdraws SET status = ? WHERE id = ?', ['cancelled', id]);
            await commit();

            sendLog('cryptoWithdraws', `Crypto withdraw cancelled by *${transaction.username}* (\`${req.userId}\`) - :robux:R$${transaction.robuxAmount} (#${id})`);
            res.json({ success: true });

        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }

});

module.exports = router;