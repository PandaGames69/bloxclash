const { sql, doTransaction } = require('../../../database');
const { newBets } = require('../../../socketio/bets');
const { sleep, roundDecimal } = require('../../../utils');
const { sha256, generateServerSeed } = require('../../../fairness');
const { getEOSBlockNumber, waitForEOSBlock } = require('../../../fairness/eos');
const io = require('../../../socketio/server');
const crypto = require('crypto');

const jackpot = {
    round: {},
    bets: [],
    config: {
        minPlayers: 2,
        betTime: 30000,
        rollTime: 5000,
        minBet: 1,
        maxBet: 20000
    }
};

const combine = (serverSeed, clientSeed) => {
    return crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');
}

// returns a float between 0 and 1
const getFloatResult = hashedValue => {
    let decimalNumber = parseInt(hashedValue, 16);
    let maxDecimalValue = parseInt('f'.repeat(64), 16);
    let floatNumber = decimalNumber / (maxDecimalValue - 1);
    return Number(floatNumber.toFixed(7));
};

async function getJackpotRound() {

    const [[round]] = await sql.query('SELECT * FROM jackpot WHERE endedAt IS NULL ORDER BY id ASC LIMIT 1');

    if (!round) {

        const now = new Date();
        const serverSeed = generateServerSeed();
        const [result] = await sql.query('INSERT INTO jackpot (serverSeed, createdAt) VALUES (?, ?)', [serverSeed, now]);

        return {
            id: result.insertId,
            amount: 0,
            winnerBet: null,
            ticket: null,
            serverSeed,
            EOSBlock: null,
            clientSeed: null,
            new: true,
            createdAt: now,
            rolledAt: null,
            endedAt: null
        }

    }

    return round;

}

let unhashedSeed = false;

async function updateJackpot() {

    const round = await getJackpotRound();
    if (!round) return;

    unhashedSeed = round.serverSeed;
    round.serverSeed = sha256(round.serverSeed);
    round.countStartedAt = null;    

    jackpot.round = round;
    
    if (!jackpot.round.new) {

        const [bets] = await sql.query(`
            SELECT jackpotBets.userId, users.username, users.role, users.xp, users.anon, jackpotBets.ticketsFrom, jackpotBets.ticketsTo,
            jackpotBets.amount, jackpotBets.id, jackpotBets.createdAt FROM jackpotBets
            INNER JOIN users ON users.id = jackpotBets.userId WHERE jackpotId = ? ORDER BY jackpotBets.id ASC
        `, [round.id]);

        if (bets.length) {
            const lastBetAt = bets[bets.length - 1].createdAt;

            const uniquePlayers = [...new Set(bets.map(bet => bet.userId))];
            if (uniquePlayers.length >= jackpot.config.minPlayers) {
                jackpot.round.countStartedAt = lastBetAt;
            }
    
            jackpot.bets = bets.map(bet => ({
                id: bet.id,
                user: {
                    id: bet.userId,
                    username: bet.username,
                    role: bet.role,
                    xp: bet.xp,
                    anon: bet.anon
                },
                amount: bet.amount,
                ticketsFrom: bet.ticketsFrom,
                ticketsTo: bet.ticketsTo
            }));
        } else {
            jackpot.bets = [];
        }

    } else {
        delete jackpot.round.new;
        jackpot.bets = [];
    }

    io.to('jackpot').emit('jackpot:new', jackpot.round);

    if (jackpot.bets.length) {
        io.to('jackpot').emit('jackpot:bets', jackpot.bets);
    }

}

async function cacheJackpot() {

    await updateJackpot();
    jackpotInterval();

}

let resolveCountdown = false;

async function startCountdown() {
    
    if (!resolveCountdown) return;

    jackpot.round.countStartedAt = new Date();
    resolveCountdown();
    resolveCountdown = false;

    io.to('jackpot').emit('jackpot:countStart', jackpot.round.countStartedAt);

}

async function jackpotInterval() {

    if (!jackpot.round.countStartedAt) {
        const promise = new Promise(resolve => {
            
            resolveCountdown = resolve;

            if (jackpot.bets.length) {
                const roundId = jackpot.round.id;

                setTimeout(() => {
                    
                    if (jackpot.round.id != roundId) return;
                    if (jackpot.round.countStartedAt) return;
                    makeBotJoin();
    
                }, 60000)
            }

        });

        await promise;
    }

    if (!jackpot.round.rolledAt) {

        const rollsIn = jackpot.config.betTime - (Date.now() - jackpot.round.countStartedAt.getTime());
        if (rollsIn > 0) await sleep(rollsIn);

        let commitTo = jackpot.round.EOSBlock;

        if (!commitTo) {
    
            const blockNumber = await getEOSBlockNumber();
            commitTo = blockNumber + 2;
        
            await sql.query("UPDATE jackpot SET EOSBlock = ? WHERE id = ?", [commitTo, jackpot.round.id]);

            io.to('jackpot').emit('jackpot:commit', commitTo);
            jackpot.round.EOSBlock = commitTo;
    
        }
    
        const clientSeed = jackpot.round.clientSeed || await waitForEOSBlock(commitTo);
        const totalTickets = (jackpot.round.amount * 100) - 1;

        const winnerTicket = Math.floor(totalTickets * getFloatResult(combine(unhashedSeed, clientSeed)));
        const winner = jackpot.bets.find(bet => winnerTicket >= bet.ticketsFrom && winnerTicket <= bet.ticketsTo);

        const now = new Date();

        jackpot.round.winnerTicket = winnerTicket;
        jackpot.round.serverSeed = unhashedSeed;
        jackpot.round.clientSeed = clientSeed;
        jackpot.round.winnerBet = winner.id;
        jackpot.round.rolledAt = now;
        
        await sql.query('UPDATE jackpot SET rolledAt = ?, ticket = ?, clientSeed = ?, winnerBet = ? WHERE id = ?', [now, winnerTicket, clientSeed, winner.id, jackpot.round.id]);
        io.to('jackpot').emit('jackpot:roll', jackpot.round.id, unhashedSeed, clientSeed, winner.id, winnerTicket);

    }

    await sleep(jackpot.config.rollTime);

    jackpot.round.endedAt = new Date();

    try {

        await doTransaction(async (connection, commit) => {

            await connection.query('UPDATE jackpot SET endedAt = ? WHERE id = ?', [jackpot.round.endedAt, jackpot.round.id]);
            if (!jackpot.bets.length) return await commit();
                
            const socketBets = [];
            const betIds = [];

            const winnings = roundDecimal(jackpot.round.amount * 0.95);

            for (const bet of jackpot.bets) {

                betIds.push(bet.id);
                let won = 0;

                if (bet.id == jackpot.round.winnerBet) {
                    won = winnings;
                    if (bet.user.role != 'BOT') {
                        io.to(bet.user.id).emit('balance', 'add', won);
                        await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [won, bet.user.id]);
                    }
                }

                socketBets.push({ user: bet.user, amount: bet.amount, edge: roundDecimal(bet.amount * 0.05), payout: won, game: 'jackpot' });

            }

            await connection.query(`
                UPDATE bets SET completed = 1, winnings = CASE WHEN gameId = ? THEN ? ELSE 0 END WHERE game = ? AND gameId IN(?)`,
                [jackpot.round.winnerBet, winnings, 'jackpot', betIds]
            );

            await commit();
            newBets(socketBets);
    
        });

    } catch (e) {
        console.error(e);
    }
    
    await sleep(5000);

    await updateJackpot();
    jackpotInterval();

}

async function makeBotJoin(amount = jackpot.round.amount) {

    try {

        await doTransaction(async (connection, commit) => {

            await connection.query('SELECT id FROM jackpot WHERE id = ? FOR UPDATE', [jackpot.round.id]);

            const [[bot]] = await connection.query('SELECT id, username, role, xp FROM users WHERE role = ? LIMIT 1', ['BOT']);
            if (!bot) return console.warn('No bot found jackpot');
    
            const ticketsFrom = jackpot.round.amount * 100;
            const ticketsTo = ticketsFrom + (amount * 100) - 1;
    
            const [jackpotBetResult] = await connection.query('INSERT INTO jackpotBets (userId, jackpotId, amount, ticketsFrom, ticketsTo) VALUES (?, ?, ?, ?, ?)', [bot.id, jackpot.round.id, amount, ticketsFrom, ticketsTo]);
            const [betResult] = await connection.query('INSERT INTO bets (userId, amount, edge, game, gameId, completed) VALUES (?, ?, ?, ?, ?, ?)', [bot.id, amount, roundDecimal(amount * 0.05), 'jackpot', jackpotBetResult.insertId, false]);
    
            jackpot.round.amount = roundDecimal(jackpot.round.amount + amount);
            await connection.query('UPDATE jackpot SET amount = ? WHERE id = ?', [jackpot.round.amount, jackpot.round.id]);
            
            await commit();
    
            const bet = {
                id: jackpotBetResult.insertId,
                user: {
                    id: bot.id,
                    username: bot.username,
                    role: bot.role,
                    xp: bot.xp
                },
                ticketsFrom,
                ticketsTo,
                amount
            };
        
            jackpot.bets.push(bet);
            startCountdown();
    
            io.to('jackpot').emit('jackpot:bets', [bet]);
            
        });

    } catch (e) {
        console.error(e);
    }

}

module.exports = {
    cacheJackpot,
    startCountdown,
    makeBotJoin,
    jackpot
}