const express = require('express');
const router = express.Router();

const axios = require("axios");
const { sha256 } = require('../../../fairness');
const crypto = require('crypto');

const { sql, doTransaction } = require('../../../database');
const io = require('../../../socketio/server');

const { isAuthed, apiLimiter } = require('../../auth/functions');
const { enabledFeatures, depositBonus } = require('../../admin/config');
const { roundDecimal, sendLog, newNotification, formatConsoleError } = require('../../../utils');
const { cryptoData } = require('../crypto/deposit/functions');

const WebSocket = require('ws');

const buildSignature = (data, secret) => {
    let signatureString = "";

    Object.keys(data).sort().forEach((key) => {
        if (key === "signature") return;
        if (typeof data[key] === "object") return;
        signatureString += data[key];
    })
    return sha256(`${signatureString}${secret}`);
}

const fees = {
    percent: 3.5,
    fixed: 0.35
}

const min = 5;
const max = 500;

function addFees(amount) {
    return +(Math.ceil((amount * (fees.percent / 100) + fees.fixed + amount) * 10) / 10).toFixed(2);
}

router.get('/', async (req, res) => {

    res.json({
        minAmount: addFees(min),
        maxAmount: addFees(max),
        percentFee: fees.percent,
        fixedFee: fees.fixed, 
        rate: cryptoData.robuxRate
    });

});

router.post('/', apiLimiter, isAuthed, async (req, res) => {

    if (!enabledFeatures.cardDeposits) return res.status(400).json({ error: 'DISABLED' });

    let amount = req.body.amount;
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'INVALID_AMOUNT' });

    amount = roundDecimal((amount / cryptoData.robuxRate.robux) * cryptoData.robuxRate.usd);
    if (amount < min) return res.status(400).json({ error: 'MIN_DEPOSIT_CC' });
    if (amount > max) return res.status(400).json({ error: 'MAX_DEPOSIT_CC' });

    // let robux = Math.floor(amount * cryptoData.robuxRate.robux / cryptoData.robuxRate.usd);
    // console.log(amount, addFees(amount), robux);
    // return res.json({ error: 'DISABLED' });

    const dataToEncrypt = {
        userId: crypto.randomUUID() // req.userId
    };

    const signature = buildSignature(dataToEncrypt, process.env.ZEBRA_API_KEY);
    const dataToSend = {
        ...dataToEncrypt,
        signature
    };

    let tradeRes;

    try {
        const { data: tradeResp } = await axios({
            url: `https://api.zebrasmarket.com/partner/${process.env.ZEBRA_PARTNER_ID}/trade_url`,
            method: 'POST',
            data: dataToSend,
            validateStatus: () => true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        tradeRes = tradeResp;
    } catch (e) {
        console.error(formatConsoleError(e));
        return res.status(400).json({ error: 'UNKNOWN_ERROR' });
    }

    if (tradeRes.error) {
        if (tradeRes.spam) {
            console.log('Rate-limit reached on cc deposit');
            return res.status(400).json({ error: 'SLOW_DOWN' });
        } else {
            console.log(`Error on cc deposit`, tradeRes.msg || tradeRes);
        }
        return res.status(400).json({ error: 'UNKNOWN_ERROR' });
    }

    const data = tradeRes.data;
    const orderId = data.orderId;

    const token = data.url.split('token=')[1];
    const stripeRes = await getStripeUrl(token, orderId, amount);

    if (!stripeRes || stripeRes.error || !stripeRes.data.url) {
        console.log(`Error on cc deposit stripeRes`, stripeRes);
        return res.status(400).json({ error: 'UNKNOWN_ERROR' });
    }

    await sql.query('INSERT INTO cardDeposits (orderId, fiatAmount, userId) VALUES (?, ?, ?)', [orderId, amount, req.userId]);
    res.json({ url: stripeRes.data.url });

});

router.get('/ipn', incomingIpn);
router.post('/ipn', incomingIpn);

async function incomingIpn(req, res) {

    const ipnSignature = buildSignature(req.body, process.env.ZEBRA_API_KEY);
    const sentSignature = req.body.signature;

    if (ipnSignature != sentSignature) {
        console.log('invalid signature on cc deposit', req.body);
        return res.status(400).json({ error: 'INVALID_SIGNATURE' });
    }

    const orderId = req.body.orderId;
    const value = roundDecimal(+req.body.value / 100);

    try {

        await doTransaction(async (connection, commit) => {

            const [[deposit]] = await connection.query('SELECT u.balance, u.username, userId, fiatAmount, completed FROM cardDeposits cd JOIN users u ON u.id = cd.userId WHERE orderId = ? FOR UPDATE', [orderId]);
            if (!deposit) {
                console.log(`Invalid orderId on cc deposit`, orderId);
                return res.status(400).json({ error: 'INVALID_ORDER_ID' });
            }
            
            if (deposit.completed) return res.json({ success: true });
    
            if (value > deposit.fiatAmount) {
                console.log(`Invalid amount on cc deposit`, value, deposit.fiatAmount);
                return res.status(400).json({ error: 'INVALID_AMOUNT' });
            }
    
            let robux = Math.floor(deposit.fiatAmount * cryptoData.robuxRate.robux / cryptoData.robuxRate.usd);
    
            await connection.query('UPDATE cardDeposits SET robuxAmount = ?, completed = 1 WHERE orderId = ?', [robux, orderId]);
            const [txResult] = await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [deposit.userId, robux, 'deposit', 'card', orderId]);
    
            if (depositBonus) {
                const bonus = roundDecimal(robux * depositBonus);
                await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [deposit.userId, bonus, 'in', 'deposit-bonus', txResult.insertId]);
                robux = roundDecimal(robux + bonus);
            }
    
            await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [robux, deposit.userId]);
            await newNotification(deposit.userId, 'deposit-completed', { txId: txResult.insertId, amount: robux }, connection);
    
            await commit();

            io.to(deposit.userId).emit('balance', 'add', robux);
            sendLog('cardDeposits', `*${deposit.username}* (\`${deposit.userId}\`) deposited :robux: R$${robux} ($${deposit.fiatAmount}usd) with credit card.`);
            res.json({ success: true });

        })

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

}

async function getStripeUrl(token, orderId, amount) {

    return new Promise(async (resolve, reject) => {

        const ws = new WebSocket('wss://api.zebrasmarket.com/socket.io/?EIO=4&transport=websocket', {
            headers: {
                Origin: 'https://zebrasmarket.com'
            }
        });

        const b = [
            "entity:purchase",
            {
                "story": `BloxClash${orderId}`,
                "value": amount,
                "token": token
            }
        ];

        ws.on('open', function open() {
            // console.log('connected');
            ws.send(`40`);
        });

        let done = false;

        ws.on('message', function incoming(data) {

            const m = data.toString();

            if (m.startsWith('40{')) {
                ws.send(`420${JSON.stringify(b)}`);
            } else if (m == '2') {
                return ws.send(`3`);
            } else if (m.startsWith('430')) {
                const d = JSON.parse(m.slice(3));
                done = true;
                resolve(d?.[0]);
                ws.terminate();
            }

        });

        ws.on('close', function close() {
            if (!done) {
                console.log('cc close');
                resolve(false);
            }
        });

        ws.on('error', console.error);

        setTimeout(() => {
            if (!done) {
                ws.terminate();
                console.log('cc timeout');
                resolve(false);
            }
        }, 2000);

    });

}

module.exports = router;