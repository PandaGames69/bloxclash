const { sql, doTransaction } = require('../../../database');
const { newBets } = require('../../../socketio/bets');
const { sleep, roundDecimal } = require('../../../utils');
const { sha256 } = require('../../../fairness') 
const io = require('../../../socketio/server');

const crash = {
    round: {},
    bets: [],
    last: [],
    config: {
        betTime: 10000,
        tick: 150,
        maxProfit: 1000000
    }
};

const growthFunc = ms => Math.floor(100 * Math.pow(Math.E, 0.00006 * ms)) / 100;
// const inverseGrowth = result => Math.log(result / 100) / 0.00006;

const lastResults = 10;
const tickRate = crash.config.tick;

async function getCrashRound() {

    const [[round]] = await sql.query('SELECT * FROM crash WHERE endedAt IS NULL ORDER BY id ASC LIMIT 1');
    if (!round) return;

    const now = new Date();

    if (!round.createdAt) {
        await sql.query('UPDATE crash SET createdAt = ? WHERE id = ?', [now, round.id]);
        round.new = true;
    }

    round.createdAt = now;
    return round;

}

async function updateCrash() {

    const round = await getCrashRound();
    if (!round) return;

    round.serverSeed = sha256(round.serverSeed);
    crash.round = round;

    if (!crash.round.new) {

        const [bets] = await sql.query(`
            SELECT crashBets.userId, users.username, users.xp, users.role, users.anon, crashBets.autoCashoutPoint, crashBets.cashoutPoint, crashBets.amount, crashBets.id FROM crashBets
            INNER JOIN users ON users.id = crashBets.userId WHERE roundId = ?
        `, [round.id]);

        crash.bets = bets.map(bet => ({
            id: bet.id,
            user: {
                id: bet.userId,
                username: bet.username,
                role: bet.role,
                xp: bet.xp,
                anon: bet.anon
            },
            amount: bet.amount,
            cashoutPoint: bet.cashoutPoint,
            autoCashoutPoint: bet.autoCashoutPoint
        }));

    } else {
        crash.bets = [];
    }

    io.to('crash').emit('crash:new', {
        id: round.id,
        serverSeed: round.serverSeed,
        createdAt: round.createdAt
    });

    if (crash.bets.length) {
        io.to('crash').emit('crash:bets', crash.bets);
        // io.to('crash').emit('crash:bets', crash.bets.map(e => ({
        //     ...e,
        //     autoCashoutPoint: undefined
        // })));
    }

}

async function cacheCrash() {

    const [last] = await sql.query('SELECT crashPoint FROM crash WHERE endedAt IS NOT NULL ORDER BY id DESC LIMIT ?', [lastResults]);
    crash.last = last.map(bet => bet.crashPoint);

    await updateCrash();
    crashInterval();

}

function processCashoutsBelow(multiplier) {

    crash.bets.forEach(async bet => {
        
        if (bet.cashoutPoint) return;
        if (!bet.autoCashoutPoint) return;
        if (bet.autoCashoutPoint > multiplier) return;

        bet.cashoutPoint = bet.autoCashoutPoint;

        try {

            await doTransaction(async (connection, commit) => {

                await connection.query('UPDATE crashBets SET cashoutPoint = ? WHERE id = ?', [bet.cashoutPoint, bet.id]);
                const winnings = roundDecimal(bet.amount * bet.cashoutPoint);
                bet.winnings = winnings > crash.config.maxProfit ? crash.config.maxProfit : winnings;
        
                await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [bet.winnings, bet.user.id]);
                await connection.query('UPDATE bets SET completed = 1, winnings = ? WHERE game = ? AND gameId = ?', [bet.winnings, 'crash', bet.id]);
        
                await commit();

            });

        } catch (e) {
            console.error(e);
            return;
        }

        io.to(bet.user.id).emit('balance', 'add', bet.winnings);
    
        io.to('crash').emit('crash:cashout', {
            id: bet.id,
            cashoutPoint: bet.cashoutPoint,
            winnings: bet.winnings
        });

        newBets([{
            user: bet.user,
            amount: bet.amount,
            edge: roundDecimal(bet.amount * 0.075),
            payout: bet.winnings,
            game: 'crash'
        }]);

        
    });

}

async function crashInterval() {

    if (!crash.round.startedAt) {

        await sleep(crash.config.betTime);

        crash.round.startedAt = new Date();
        await sql.query('UPDATE crash SET startedAt = ? WHERE id = ?', [crash.round.startedAt, crash.round.id]);
    
        io.to('crash').emit('crash:start', {
            id: crash.round.id
        });
    
    }

    while (!crash.round.endedAt) {
    
        const ms = new Date() - crash.round.startedAt;
        let currentMultiplier = growthFunc(ms);

        // console.log(currentMultiplier, crash.round.crashPoint)

        if (currentMultiplier > crash.round.crashPoint) {
            currentMultiplier = crash.round.crashPoint;
        } 

        processCashoutsBelow(currentMultiplier);
        io.to('crash').emit('crash:tick', currentMultiplier);
        crash.round.currentMultiplier = currentMultiplier;

        if (currentMultiplier < crash.round.crashPoint) {
            await sleep(tickRate);
            continue;
        }    

        crash.round.endedAt = new Date();

    }

    try {
        await doTransaction(async (connection, commit) => {
            await connection.query('UPDATE crash SET endedAt = ? WHERE id = ?', [crash.round.endedAt, crash.round.id]);
            if (crash.bets.length) await connection.query('UPDATE bets SET completed = 1 WHERE game = ? AND gameId IN (?)', ['crash', crash.bets.map(bet => bet.id)]);
            await commit();
        });
    } catch (e) {
        return console.error(e);
    }

    io.to('crash').emit('crash:end', {
        id: crash.round.id,
        crashPoint: crash.round.crashPoint
    }); 

    if (crash.bets.length) {

        const losers = crash.bets.map(bet => {
        
            if (bet.cashoutPoint) return;
            return { user: bet.user, amount: bet.amount, edge: roundDecimal(bet.amount * 0.075), payout: 0, game: 'crash' };

        }).filter(bet => bet);

        if (losers.length) newBets(losers);

    }

    crash.last.unshift(crash.round.crashPoint);
    if (crash.last.length > lastResults) crash.last.pop();

    await sleep(4000);

    await updateCrash();
    crashInterval();

}

module.exports = {
    cacheCrash,
    crash
}