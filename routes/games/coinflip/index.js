const express = require('express');
const router = express.Router();

const { doTransaction } = require('../../../database');

const { isAuthed, apiLimiter } = require('../../auth/functions');
const { roundDecimal, xpChanged } = require('../../../utils');
const io = require('../../../socketio/server');
const { cachedCoinflips, startCoinflip } = require('./functions');
const { generateServerSeed, sha256 } = require('../../../fairness');
const { enabledFeatures, xpMultiplier } = require('../../admin/config');

router.use((req, res, next) => {
    if (!enabledFeatures.coinflip) return res.status(400).json({ error: 'DISABLED' });
    next();
});

router.post('/create', isAuthed, apiLimiter, async (req, res) => {

    const amount = roundDecimal(req.body.amount);

    if (!amount || amount < 1 || amount > 20000) {
        return res.json({ error: 'INVALID_AMOUNT' });
    }

    const side = req.body.side;
    if (!['fire', 'ice'].includes(side)) return res.json({ error: 'INVALID_SIDE' });

    try {

        await doTransaction(async (connection, commit) => {

            const [[user]] = await connection.query('SELECT id, username, balance, role, xp FROM users WHERE id = ? FOR UPDATE', [req.userId]);

            if (user.balance < amount) {
                return res.json({ error: 'INSUFFICIENT_BALANCE' });
            }
    
            const xp = roundDecimal(amount * xpMultiplier);
            await connection.query('UPDATE users SET balance = balance - ?, xp = xp + ? WHERE id = ?', [amount, xp, user.id]);
    
            const serverSeed = generateServerSeed();
            const [coinflipResult] = await connection.query(`INSERT INTO coinflips (ownerId, ${side}, amount, serverSeed) VALUES (?, ?, ?, ?)`, [user.id, user.id, amount, serverSeed]);
            const coinflipId = coinflipResult.insertId;
            
            await connection.query('INSERT INTO bets (userId, amount, edge, game, gameId, completed) VALUES (?, ?, ?, ?, ?, ?)', [user.id, amount, roundDecimal(amount * 0.05), 'coinflip', coinflipId, false]);
    
            io.to(user.id).emit('balance', 'set', roundDecimal(user.balance - amount));
            await xpChanged(user.id, user.xp, roundDecimal(user.xp + xp), connection);
            await commit();

            const coinflip = {
                id: coinflipId,
                ownerSide: side,
                fire: null,
                ice: null,
                amount,
                winnerSide: null,
                serverSeed: sha256(serverSeed),
                EOSBlock: null,
                createdAt: new Date(),
                startedAt: null
            };
    
            coinflip[side] = {
                id: user.id,
                username: user.username,
                role: user.role,
                xp: user.xp
            };
    
            cachedCoinflips[coinflipId] = coinflip;
            io.to('coinflips').emit('coinflips:push', [coinflip], new Date());
    
            res.json({ success: true, coinflip });

        });

    } catch (e) {
        console.error(e);
        return res.json({ error: 'INTERNAL_ERROR' });
    }
    
});

router.post('/:id/join', isAuthed, apiLimiter, async (req, res) => {
    joinCoinflip(req, res);
});


router.post('/:id/bot', isAuthed, apiLimiter, async (req, res) => {
    joinCoinflip(req, res, true);
});

async function joinCoinflip(req, res, bot = false) {

    const id = req.params.id;
    if (!id) return res.json({ error: 'INVALID_ID' });

    try {

        await doTransaction(async (connection, commit) => {
            const [[coinflip]] = await connection.query(`
                SELECT c.*,
                f.id AS fire_id, f.username AS fire_username, f.role AS fire_role, f.xp AS fire_xp, f.anon AS fire_anon,
                i.id AS ice_id, i.username AS ice_username, i.role AS ice_role, i.xp AS ice_xp, i.anon AS ice_anon
                FROM coinflips c
                LEFT JOIN users f ON c.fire = f.id
                LEFT JOIN users i ON c.ice = i.id
                WHERE c.id = ? FOR UPDATE
            `, [id]);
    
            //const [[coinflip]] = await sql.query('SELECT * FROM coinflips WHERE id = ? FOR UPDATE', [id]);

            if (!coinflip) return res.json({ error: 'INVALID_ID' });
            if (coinflip.fire && coinflip.ice) return res.json({ error: 'ALREADY_STARTED' });

            let user;

            if (bot) {
                if (coinflip.ownerId != req.userId) return res.status(403).json({ error: 'FORBIDDEN' });
                [[user]] = await connection.query('SELECT id, username, xp, role, anon FROM users WHERE role = ? LIMIT 1', ['BOT']);
                if (!user) return res.status(500).json({ error: 'NO_BOTS_AVAILABLE' });
            } else {
                if ((coinflip.fire || coinflip.ice) == req.userId) return res.json({ error: 'ALREADY_JOINED' });
                [[user]] = await connection.query('SELECT id, username, role, balance, xp, anon FROM users WHERE id = ? FOR UPDATE', [req.userId]);

                if (user.balance < coinflip.amount) {
                    return res.json({ error: 'INSUFFICIENT_BALANCE' });
                }
                
                const xp = roundDecimal(coinflip.amount * xpMultiplier);
                await connection.query('UPDATE users SET balance = balance - ?, xp = xp + ? WHERE id = ?', [coinflip.amount, xp, user.id]);
                io.to(user.id).emit('balance', 'set', roundDecimal(user.balance - coinflip.amount));
                await xpChanged(user.id, user.xp, roundDecimal(user.xp + xp), connection);
            }

            let side;

            if (coinflip.fire) {

                coinflip.fire = {
                    id: coinflip.fire_id,
                    username: coinflip.fire_username,
                    role: coinflip.fire_role,
                    xp: coinflip.fire_xp,
                    anon: coinflip.fire_anon,
                };

                side = 'ice';

            } else {

                coinflip.ice = {
                    id: coinflip.ice_id,
                    username: coinflip.ice_username,
                    role: coinflip.ice_role,
                    xp: coinflip.ice_xp,
                    anon: coinflip.ice_anon,
                };

                side = 'fire';

            }

            await connection.query(`UPDATE coinflips SET ${side} = ? WHERE id = ?`, [user.id, id]);
            await connection.query('INSERT INTO bets (userId, amount, edge, game, gameId, completed) VALUES (?, ?, ?, ?, ?, ?)', [user.id, coinflip.amount, roundDecimal(coinflip.amount * 0.05), 'coinflip', coinflip.id, false]);
            await commit();

            const coinflipUser = {
                id: user.id,
                username: user.username,
                role: user.role,
                xp: user.xp,
                anon: user.anon
            }

            coinflip[side] = coinflipUser;
            cachedCoinflips[coinflip.id][side] = coinflipUser;

            io.to('coinflips').emit('coinflip:join', coinflip.id, side, coinflipUser);

            res.json({ success: true });
            startCoinflip(coinflip);

        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

}

module.exports = router;