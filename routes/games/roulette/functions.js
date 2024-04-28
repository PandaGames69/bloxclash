const { sql, doTransaction } = require('../../../database');
const { newBets } = require('../../../socketio/bets');
const { sleep, roundDecimal } = require('../../../utils');
const io = require('../../../socketio/server');

const colorsMultipliers = {
    0: 14,
    1: 2,
    2: 2
}

const roulette = {
    round: {},
    bets: [],
    last: [],
    config: {
        maxBet: 25000,
        betTime: 10000,
        rollTime: 5000
    }
};

const lastResults = 100;

async function getRouletteRound() {

    const [[round]] = await sql.query('SELECT * FROM roulette WHERE endedAt IS NULL ORDER BY id ASC LIMIT 1');
    if (!round) return;

    const now = new Date();

    if (!round.createdAt) {
        await sql.query('UPDATE roulette SET createdAt = ? WHERE id = ?', [now, round.id]);
        round.new = true;
    }

    round.createdAt = now;
    return round;

}

async function updateRoulette() {

    const round = await getRouletteRound();
    if (!round) return;

    roulette.round = round;
    
    if (!roulette.round.new) {

        const [bets] = await sql.query(`
            SELECT rouletteBets.userId, users.username, users.xp, users.anon, rouletteBets.color, rouletteBets.amount, rouletteBets.id FROM rouletteBets
            INNER JOIN users ON users.id = rouletteBets.userId WHERE roundId = ?
        `, [round.id]);

        roulette.bets = bets.map(bet => ({
            id: bet.id,
            user: {
                id: bet.userId,
                username: bet.username,
                xp: bet.xp,
                anon: bet.anon
            },
            color: bet.color,
            amount: bet.amount
        }));

    } else {
        roulette.bets = [];
    }

    io.to('roulette').emit('roulette:new', {
        id: round.id,
        createdAt: round.createdAt
    });

    if (roulette.bets.length) {
        io.to('roulette').emit('roulette:bets', roulette.bets);
    }

}

async function cacheRoulette() {

    const [last] = await sql.query('SELECT result FROM roulette WHERE endedAt IS NOT NULL ORDER BY id DESC LIMIT ?', [lastResults]);
    roulette.last = last.map(bet => bet.result);

    await updateRoulette();
    rouletteInterval();

}

async function rouletteInterval() {

    // const startedAgo = new Date() - roulette.round.createdAt;

    // if (startedAgo < betTime) {
    //     await sleep(betTime - startedAgo);
    // }

    if (!roulette.round.rolledAt) {

        await sleep(roulette.config.betTime);

        roulette.round.rolledAt = new Date();
        await sql.query('UPDATE roulette SET rolledAt = ? WHERE id = ?', [roulette.round.rolledAt, roulette.round.id]);

        io.to('roulette').emit('roulette:roll', {
            id: roulette.round.id,
            result: roulette.round.result,
            color: roulette.round.color
        });

    }

    await sleep(roulette.config.rollTime);

    roulette.round.endedAt = new Date();

    try {

        await doTransaction(async (connection, commit) => {
            
            await connection.query('UPDATE roulette SET endedAt = ? WHERE id = ?', [roulette.round.endedAt, roulette.round.id]);
            if (!roulette.bets.length) return await commit();

            const updateUserBalanceStmt = await connection.prepare('UPDATE users SET balance = balance + ? WHERE id = ?');
            const updateBetsStmt = await connection.prepare('UPDATE bets SET completed = 1, winnings = ? WHERE game = ? AND gameId = ?');
            const socketBets = [];

            for (const bet of roulette.bets) {
                const color = roulette.round.color;
                let won = 0;
    
                if (color === bet.color) {
                    won = bet.amount * colorsMultipliers[color];
                    await updateUserBalanceStmt.execute([won, bet.user.id]);
                    io.to(bet.user.id).emit('balance', 'add', won);
                }
    
                await updateBetsStmt.execute([won, 'roulette', bet.id]);
                socketBets.push({ user: bet.user, amount: bet.amount, edge: roundDecimal(bet.amount * 0.05), payout: won, game: 'roulette' });
            }
                
            await commit();
            newBets(socketBets);
  
        });

    } catch (error) {
        console.error("Roulette err:", error);
    }

    roulette.last.unshift(roulette.round.result);
    if (roulette.last.length > lastResults) roulette.last.pop();

    await sleep(2500);

    await updateRoulette();
    rouletteInterval();

}

module.exports = {
    roulette,
    cacheRoulette
}