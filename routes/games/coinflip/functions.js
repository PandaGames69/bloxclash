const { sql, doTransaction } = require('../../../database');
const io = require('../../../socketio/server');
const { sha256 } = require('../../../fairness');
const { getEOSBlockNumber, waitForEOSBlock } = require('../../../fairness/eos');
const { roundDecimal } = require('../../../utils');
const { newBets } = require('../../../socketio/bets');

const crypto = require('crypto');

const cachedCoinflips = {};

const combine = (serverSeed, clientSeed) => {
    return crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');
}

const getResult = hashedValue => {
    const number = parseInt(hashedValue.charAt(1), 16);
    return (number % 2 === 0) ? 'ice' : 'fire'
};

const minCoinflips = 10;

async function cacheCoinflips() {

    const [coinflips] = await sql.query(`
        SELECT c.*,
        f.id AS fire_id, f.username AS fire_username, f.role AS fire_role, f.xp AS fire_xp,
        i.id AS ice_id, i.username AS ice_username, i.role AS ice_role, i.xp AS ice_xp
        FROM coinflips c
        LEFT JOIN users f ON c.fire = f.id
        LEFT JOIN users i ON c.ice = i.id
        WHERE c.winnerSide IS NULL
    `);

    if (coinflips.length < minCoinflips) {
        const [recentCoinflips] = await sql.query(`
            SELECT c.*,
            f.id AS fire_id, f.username AS fire_username, f.role AS fire_role, f.xp AS fire_xp,
            i.id AS ice_id, i.username AS ice_username, i.role AS ice_role, i.xp AS ice_xp
            FROM coinflips c
            LEFT JOIN users f ON c.fire = f.id
            LEFT JOIN users i ON c.ice = i.id
            WHERE c.winnerSide IS NOT NULL LIMIT ${minCoinflips - coinflips.length}
        `);
        coinflips.push(...recentCoinflips);
    }

    for (const coinflip of coinflips) {

        if (coinflip.fire) {
            coinflip.fire = {
                id: coinflip.fire_id,
                username: coinflip.fire_username,
                role: coinflip.fire_role,
                xp: coinflip.fire_xp
            };
        }

        delete coinflip.fire_id;
        delete coinflip.fire_username;
        delete coinflip.fire_role;
        delete coinflip.fire_xp;

        if (coinflip.ice) {
            coinflip.ice = {
                id: coinflip.ice_id,
                username: coinflip.ice_username,
                role: coinflip.ice_role,
                xp: coinflip.ice_xp
            };
        }

        coinflip.ownerSide = coinflip.fire?.id == coinflip.ownerId ? 'fire' : 'ice';
        delete coinflip.ownerId;

        delete coinflip.ice_id;
        delete coinflip.ice_username;
        delete coinflip.ice_role;
        delete coinflip.ice_xp;

        if (!coinflip.winnerSide) {
            const cachedCoinflip = {
                ...coinflip
            }

            cachedCoinflip.serverSeed = sha256(coinflip.serverSeed);
            cachedCoinflips[coinflip.id] = cachedCoinflip;
            if (coinflip.fire && coinflip.ice) startCoinflip(coinflip);
        } else {
            cachedCoinflips[coinflip.id] = coinflip;
        }

    }

}

async function startCoinflip(coinflip) {

    let commitTo = coinflip.EOSBlock;

    if (!commitTo) {
        const blockNumber = await getEOSBlockNumber();
        commitTo = blockNumber + 2;
    
        await sql.query("UPDATE coinflips SET EOSBlock = ? WHERE id = ?", [commitTo, coinflip.id]);
        coinflipCommitTo(coinflip.id, commitTo);
    }

    const clientSeed = coinflip.clientSeed || await waitForEOSBlock(commitTo);
    const winnerSide = getResult(combine(coinflip.serverSeed, clientSeed));
    const winnings = roundDecimal((coinflip.amount * 2) * 0.95);

    try {

        const winner = coinflip[winnerSide];

        await doTransaction(async (connection, commit) => {

            await connection.query("UPDATE coinflips SET clientSeed = ?, winnerSide = ?, startedAt = NOW() WHERE id = ?", [clientSeed, winnerSide, coinflip.id]);
            if (winner.role != 'BOT') await connection.query("UPDATE users SET balance = balance + ? WHERE id = ?", [winnings, winner.id]);
    
            await connection.query(`
                UPDATE bets SET completed = 1, winnings = CASE WHEN userId = ? THEN ? ELSE 0 END WHERE game = ? AND gameId = ?`,
                [winner.id, winnings, 'coinflip', coinflip.id]
            );

            await commit();

        });

        newBets([coinflip.fire, coinflip.ice].map(user => {
            return {
                user,
                amount: coinflip.amount,
                edge: roundDecimal(coinflip.amount * 0.05),
                payout: winner.id == user.id ? winnings : 0,
                game: 'coinflip'
            }
        }));

        io.to(winner.id).emit('balance', 'add', winnings, 11000);
        coinflipStarted(coinflip.id, clientSeed, coinflip.serverSeed, winnerSide);

    } catch (err) {
        console.error(err);
        return;
    }

}

function coinflipCommitTo(coinflipId, commitTo) {

    if (!cachedCoinflips[coinflipId]) return;
    const coinflip = cachedCoinflips[coinflipId];

    coinflip.EOSBlock = commitTo;
    io.to('coinflips').emit('coinflip:commit', coinflipId, commitTo);

}

function coinflipStarted(coinflipId, clientSeed, serverSeed, winnerSide) {

    if (!cachedCoinflips[coinflipId]) return;
    const coinflip = cachedCoinflips[coinflipId];

    coinflip.clientSeed = clientSeed;
    coinflip.serverSeed = serverSeed;
    coinflip.winnerSide = winnerSide;
    coinflip.startedAt = new Date();

    io.to('coinflips').emit('coinflip:started', coinflipId, clientSeed, serverSeed, winnerSide);
    // console.log(coinflip[coinflip.ownerSide].id);

    io.to(coinflip[coinflip.ownerSide].id).emit('coinflip:own:started', coinflip);

    if (Object.keys(cachedCoinflips).length > minCoinflips) {
        const oldestEnded = Object.values(cachedCoinflips).filter(e => e.startedAt).sort((a, b) => a.startedAt - b.startedAt)[0];
        delete cachedCoinflips[oldestEnded?.id];
    }

}

module.exports = {
    cachedCoinflips,
    startCoinflip,
    cacheCoinflips
}