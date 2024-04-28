const express = require('express');
const router = express.Router();

const { sql, doTransaction } = require('../../../../../database');
const axios = require('axios');

const { apiLimiter } = require('../../../../auth/functions');
const { roundDecimal, xpChanged, formatConsoleError } = require('../../../../../utils');
const io = require('../../../../../socketio/server');
const { enabledFeatures, xpMultiplier } = require('../../../../admin/config');
const { newBets } = require('../../../../../socketio/bets');
const { hacksawTokens: tokens } = require('../../functions');
const { slots } = require('../../functions');
const { getSlotsProxy, getAgent } = require('../../../../../utils/proxies');

const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const crypto = require('crypto');

router.use((req, res, next) => {
    if (!enabledFeatures.slots) return res.status(400).json({ error: 'DISABLED' });
    next();
});

const internalCurrency = 'USD';
const externalCurrency = 'BRL';
const agents = {};

const hacksawApi = axios.create({
    baseURL: 'https://rgs-demo.hacksawgaming.com/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate, decompress'
    },
    validateStatus: () => {
        return true;
    },
});

router.post('/play/authenticate', apiLimiter, async (req, res) => {

    const userId = tokens[req.body.token];
    if (!userId) return res.json({ error: 'UNAUTHORIZED' });
    delete tokens[req.body.token];

    let user;

    try {

        await doTransaction(async (connection, commit) => {

            [[user]] = await connection.query('SELECT username, balance FROM users WHERE id = ?', [userId]);

            // const [oldSessions] = await sql.query('SELECT id FROM hacksawSessions WHERE userId = ? AND gameId = ? AND ended = 0', [userId, req.body.gameId]);
            await connection.query('UPDATE hacksawSessions SET ended = 1 WHERE userId = ? AND gameId = ? AND ended = 0', [userId, req.body.gameId]);
        
            const [unfinishedSpins] = await connection.query(
                `SELECT sp.id, sp.payout FROM slotsSpins sp
                JOIN hacksawSessions hs ON hs.id = sp.sessionId
                WHERE sp.userId = ? AND sp.status <> ? AND hs.ended = 1 FOR UPDATE`,
                [userId, 'completed']
            );
        
            if (unfinishedSpins.length > 0) {
                const spinsIds = unfinishedSpins.map(s => s.id);
                await connection.query('UPDATE slotsSpins SET status = ? WHERE id IN(?)', ['completed', spinsIds]);
                let sum = 0;
                for (const spin of unfinishedSpins) {
                    sum += spin.payout;
                    await connection.query('UPDATE bets SET winnings = ?, completed = ? WHERE game = ? AND gameId = ?', [spin.payout, 1, 'slot', spin.id]);
                }
    
                if (sum) {
                    await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [sum, userId]);
                    user.balance = roundDecimal(user.balance + sum);
                    io.to(userId).emit('balance', 'set', user.balance);
                }
    
            }
    
            await commit();

        });

    } catch (e) {
        console.error(e);
        return res.json({ error: 'INTERNAL_ERROR' });
    }

    const { data } = await hacksawApi({
        method: 'POST',
        url: '/play/authenticate',
        data: {
            "seq": 1,
            "partner": "stake",
            "gameId": req.body.gameId,
            "gameVersion": req.body.gameVersion,
            "currency": internalCurrency,
            "languageCode": "en",
            "mode": 2,
            "branding": "default",
            "channel": 1,
            "userAgent": req.headers['user-agent'],
            "token": "demo"
        }
    });

    if (!data.sessionUuid) {
        return res.json({ error: 'INTERNAL_ERROR' });
    }

    const sid = crypto.randomUUID();
    await sql.query('INSERT INTO hacksawSessions (sessionId, gameId, hacksawId, bonusGames, userId, defaultBalance, balance) VALUES (?, ?, ?, ?, ?, ?, ?)', [sid, req.body.gameId, data.sessionUuid, JSON.stringify(data.bonusGames), userId, +data.accountBalance.balance, +data.accountBalance.balance]);

    data.sessionUuid = sid;
    data.name = user.username;

    data.accountBalance.currencyCode = externalCurrency;
    data.accountBalance.balance = Math.floor(user.balance * 100).toString();

    const ind = data.betLevels.findIndex(b => +b > 5000);
    data.betLevels = data.betLevels.slice(0, ind);

    res.json(data);

});

router.post('/history/:type', async (req, res) => {

    res.json({
        "statusCode": "0",
        "statusMessage": "",
        "data": [],
        "wins": []
    });

});

router.get('/meta/gameInfo', async (req, res) => {

    const { data } = await hacksawApi({
        url: '/meta/gameInfo',
        params: req.query  
    });

    const rtp = data.data?.rtp;

    if (req.query.gameId && rtp) {
        
        const slot = Object.values(slots).find(s => s.provider == 'hacksaw' && s.providerGameId == req.query.gameId);
        
        if (slot && slot.rtp != rtp) {
            slots[slot.slug].rtp = rtp;
            await sql.query('UPDATE slots SET rtp = ? WHERE id = ?', [rtp, slot.id]);
        }

    }

    res.json(data);

});

const sessionsQueues = {};

const queueMiddleware = (req, res, next) => {

    req.sessionId = req.body.sessionUuid;
    if (!req.sessionId) return res.json({ error: 'INVALID_SESSION' });

    if (!sessionsQueues[req.sessionId]) {
        sessionsQueues[req.sessionId] = [];
    }

    const queue = sessionsQueues[req.sessionId];
    queue.push(() => next());
    
    if (queue.length === 1) queue[0]();

};

function insufficientBalance(res, balance) {
    return res.json({
        "statusCode": 5,
        "statusMessage": "Insufficient Funds",
        "accountBalance": {
            "currencyCode": externalCurrency,
            "balance": Math.floor(balance * 100).toString(),
            "realBalance": null,
            "bonusBalance": null
        },
        "statusData": null,
        "dialog": null,
        "customData": null,
        "serverTime": new Date().toISOString(),
    });
}

router.post('/play/bet', queueMiddleware, async (req, res) => {

    try {
        
        const [[sessionInfo]] = await sql.query(`
            SELECT hs.id as hsId, hs.sessionId, hs.bonusGames, hs.hacksawId, hs.defaultBalance, hs.balance as oldSessionBalance, u.balance as userBalance FROM hacksawSessions hs JOIN users u ON u.id = hs.userId WHERE hs.sessionId = ? AND hs.ended = 0`
        , [req.body.sessionUuid]);

        if (!sessionInfo) return res.json({ error: 'INVALID_SESSION' });

        const { hsId, sessionId, hacksawId, bonusGames, userBalance, oldSessionBalance, defaultBalance } = sessionInfo;

        let cost = 0;

        if (req.body.bets) {

            for (const bet of req.body.bets) {

                let amount = +bet.betAmount;

                if (bet.buyBonus) {
                    const bonuses = JSON.parse(bonusGames);
                    const bonus = bonuses.find(b => b.bonusGameId == bet.buyBonus);
                    amount *= bonus.betCostMultiplier;
                }

                cost += amount;

            }

        }

        if (cost / 100 > userBalance) {
            return insufficientBalance(res, userBalance);
        }

        req.body.sessionUuid = hacksawId;

        async function placeBet(retries = 0) {

            let agent = agents[sessionId];
            if (!agent) {
                agent = getAgent(getSlotsProxy());
                agents[sessionId] = agent;
            }

            agent.lastUsedAt = Date.now();
            let hacksawRes = false;

            try {
                hacksawRes = await hacksawApi({
                    method: 'POST',
                    url: '/play/bet',
                    data: req.body,
                    httpsAgent: agent
                });
            } catch (e) {
                console.error(formatConsoleError(e));
            }

            const data = hacksawRes?.data;
    
            if (!data?.round) {
    
                if ((!data || data.statusCode == 21) && retries < 3) {
                    delete agents[sessionId];
                    return await placeBet(retries++);
                } else {
                    console.log('placeBet err', data);
                }
    
                await sql.query('UPDATE hacksawSessions SET ended = 1 WHERE id = ?', [hsId]);
                return false;
    
            }

            return data;

        }

        const data = await placeBet();
        if (!data) return res.json({ error: 'INTERNAL_ERROR' });

        let profit = -cost;

        if (cost >= oldSessionBalance) {

            if (+data.accountBalance.balance < defaultBalance) {
                await sql.query('UPDATE hacksawSessions SET ended = 1 WHERE id = ?', [hsId]);

                // https://dev-api.bloxclash.com/slots/hacksaw/play/endSession
                // body { sessionUuid }

                return res.json({ error: 'INTERNAL_ERROR' });
            } else {
                profit += +data.accountBalance.balance - defaultBalance;
            }

        } else {
            profit = +data.accountBalance.balance - oldSessionBalance;
        }

        try {

            await doTransaction(async (connection, commit) => {
            
                const [[userSession]] = await connection.query(`
                    SELECT hs.id as hsId, hs.sessionId, hs.balance as sessionBalance, s.rtp, s.id as slotId,
                    u.id as id, u.balance as userBalance, u.username, u.xp, u.role, u.anon
                    FROM hacksawSessions hs JOIN users u ON u.id = hs.userId
                    JOIN slots s ON s.provider = 'hacksaw' AND s.providerGameId = hs.gameId
                    WHERE hs.sessionId = ? FOR UPDATE
                `, [sessionId]);

                if (userSession.userBalance < cost / 100) {
                    return insufficientBalance(res, userSession.userBalance);
                }

                const balanceChange = roundDecimal(profit / 100);
                const completed = data.round.status == 'completed' ? 1 : 0;
                const payout = balanceChange > 0 ? balanceChange : 0;
                const houseEdge = Math.max((100 - Math.ceil(userSession.rtp)) / 100, 0);
                let xp = 0;

                if (req.body.roundId) {
                    
                    const [[existingSpin]] = await connection.query('SELECT id FROM slotsSpins WHERE provider = ? AND providerSpinId = ? AND status <> ?', ['hacksaw', req.body.roundId, 'completed']);
                    
                    if (!existingSpin) {
                        await connection.query('UPDATE hacksawSessions SET ended = 1 WHERE id = ?', [hsId]);
                        await commit();
                        return res.json({ error: 'INTERNAL_ERROR' });
                    }

                    await connection.query('UPDATE slotsSpins SET payout = ?, status = ? WHERE id = ?', [payout, data.round.status, existingSpin.id]);

                    if (completed) {

                        const [[existingBet]] = await connection.query('SELECT id, amount FROM bets WHERE game = ? AND gameId = ?', ['slot', existingSpin.id]);
                        await connection.query('UPDATE bets SET winnings = ?, completed = ? WHERE id = ?', [payout, completed, existingBet.id]);

                        newBets([{
                            user: userSession,
                            amount: existingBet.amount,
                            edge: roundDecimal(existingBet.amount * houseEdge),
                            payout: payout,
                            game: 'slot'
                        }]);

                    } else {
                        console.log('wtf, bet not completed after a round');
                        await connection.query('UPDATE bets SET winnings = ?, completed = ? WHERE game = ? AND gameId = ?', [payout, completed, 'slot', existingSpin.id]);
                    }

                } else {

                    const realPayout = (+data.round.events[data.round.events.length - 1].awa) / 100;
                    const amount = roundDecimal(cost / 100);
                    const edge = roundDecimal(amount * houseEdge);
                    xp = roundDecimal(amount * xpMultiplier);

                    const [result] = await connection.query('INSERT INTO slotsSpins (provider, providerSpinId, betInfo, userId, sessionId, slotId, amount, payout, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['hacksaw', data.round.roundId, JSON.stringify(req.body.bets), userSession.id, userSession.hsId, userSession.slotId, cost / 100, realPayout, data.round.status]);
                    await connection.query('INSERT INTO bets (userId, amount, winnings, edge, game, gameId, completed) VALUES (?, ?, ?, ?, ?, ?, ?)', [userSession.id, amount, payout, edge, 'slot', result.insertId, completed]);
                
                    if (completed) {
                        newBets([{
                            user: userSession,
                            amount,
                            edge,
                            payout,
                            game: 'slot'
                        }]);
                    }
                
                }

                await connection.query('UPDATE hacksawSessions SET balance = ? WHERE id = ?', [+data.accountBalance.balance, userSession.hsId]);

                const userBalance = roundDecimal(userSession.userBalance + balanceChange);
                await connection.query('UPDATE users SET balance = ?, xp = xp + ? WHERE id = ?', [userBalance, xp, userSession.id]);
 
                if (xp) {
                    await xpChanged(userSession.id, userSession.xp, roundDecimal(userSession.xp + xp), connection);
                }

                await commit();
                io.to(userSession.id).emit('balance', 'set', userBalance);
                data.accountBalance.balance = Math.floor(userBalance * 100).toString();

            });

        } catch (e) {
            console.error(e);
            return res.json({ error: 'INTERNAL_ERROR' });
        }

        data.accountBalance.currencyCode = externalCurrency;
        res.json(data);

    } catch (e) {
        console.error(e);
    } finally {
        const queue = sessionsQueues[req.sessionId];
        queue.shift();
        if (queue.length > 0) queue[0]();
    }

});

router.post('/play/keepAlive', (req, res) => {
    return res.json(defaultMessage());
});

router.post('/gameError', (req, res) => {
    console.log(`Game error reported`, req.body.errorMessage)
    return res.json(defaultMessage());
})

function defaultMessage() {
    return {
        "statusCode": 0,
        "statusMessage": "",
        "accountBalance": null,
        "statusData": null,
        "dialog": null,
        "customData": null,
        "serverTime": new Date().toISOString()
    }
}

router.use(createProxyMiddleware({
    target: 'https://rgs-demo.hacksawgaming.com',
    changeOrigin: true,
    pathRewrite: {
        '^/slots/hacksaw': '/api'
    },
    onProxyReq: fixRequestBody
}));

setInterval(() => {
    for (const sessionId in agents) {
        if (Date.now() - agents[sessionId].lastUsedAt > 1000 * 60 * 5) {
            delete agents[sessionId];
        }
    }
}, 1000 * 60 * 5);

module.exports = router;