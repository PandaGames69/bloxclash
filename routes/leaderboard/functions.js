const { sql, doTransaction } = require('../../database');
const { items } = require('../../utils/roblox/items');
const io = require('../../socketio/server');
const { enabledFeatures } = require('../admin/config');
const { sendLog } = require('../../utils');

const leaderboards = {
    'daily': {
        interval: 1000 * 60 * 60 * 24,
        rewards: {
            1: 1000,
            2: 500,
            3: 250,
            4: 50,
            5: 50,
            6: 50,
            7: 50,
            8: 50,
            9: 50,
            10: 50
        }
    },
    'weekly': {
        interval: 1000 * 60 * 60 * 24 * 7,
        rewards: {
            1: 3500,
            2: 2000,
            3: 1000,
            4: 200,
            5: 200,
            6: 200,
            7: 200,
            8: 200,
            9: 200,
            10: 200
        }
    }
}

let first = true;

async function cacheLeaderboards() {

    const types = Object.keys(leaderboards);

    if (first) {
        
        const sorted = Object.values(items).sort((a, b) => b.price - a.price);
        for (let i = 0; i < types.length; i++) {

            leaderboards[types[i]].items = {};

            for (let j = 0; j < 3; j++) {
                leaderboards[types[i]].items[j + 1] = sorted.find(item => item.price <= leaderboards[types[i]].rewards[j + 1])?.img;
            }

            await cronLeaderboard(types[i]);
            if (!leaderboards[types[i]].cache) await cacheLeaderboard(types[i]);

        }

        first = false;

    } else {
        for (let i = 0; i < types.length; i++) {
            await cacheLeaderboard(types[i]);
        }
    }

    setTimeout(cacheLeaderboards, 60000 * 10); // 10m
    
}

async function cacheLeaderboard(type) {

    const [[leaderboard]] = await sql.query(`SELECT id, createdAt FROM leaderboards WHERE type = ? AND endedAt IS NULL`, [type]);
    if (!leaderboard) return false;

    const [users] = await sql.query(
        `SELECT SUM(bets.amount) as wagered, users.id, users.username, users.xp FROM bets
        INNER JOIN users ON users.id = bets.userId
        WHERE bets.createdAt >= ? AND bets.completed = 1 AND users.leaderboardBan = 0 AND users.role = 'USER' GROUP BY userId ORDER BY wagered DESC LIMIT 10`,
        [leaderboard.createdAt]
    );

    const endsAt = new Date(new Date(leaderboard.createdAt).valueOf() + leaderboards[type].interval);

    const data = {
        ...leaderboard,
        endsAt,
        users: users.map((user, i) => ({
            ...user,
            position: i + 1,
            reward: leaderboards[type].rewards[i + 1]
        }))
    }

    data.users.slice(0, 3).forEach(user => {
        user.item = leaderboards[type].items[user.position];
    });

    leaderboards[type].cache = data;
    return data;

}

async function cronLeaderboard(type) {

    const [[leaderboard]] = await sql.query(`SELECT id, createdAt FROM leaderboards WHERE type = ? AND endedAt IS NULL`, [type]);

    if (!leaderboard) {

        console.log('Inserting new leaderboard', type);
        const date = new Date();
        const [newResult] = await sql.query(`INSERT INTO leaderboards (type, createdAt) VALUES (?, DATE(?))`, [type, date]);
        date.setHours(0,0,0,0);

        leaderboards[type].cache = {
            id: newResult.insertId,
            createdAt: date.valueOf(),
            endsAt: new Date(date.valueOf() + leaderboards[type].interval),
            users: []
        }

        return cronLeaderboard(type);

    }

    leaderboard.endsAt = new Date(new Date(leaderboard.createdAt).valueOf() + leaderboards[type].interval);
    leaderboard.endsIn = leaderboard.endsAt - Date.now();

    if (leaderboard.endsIn > 0) return setTimeout(() => cronLeaderboard(type), leaderboard.endsIn);
    if (!enabledFeatures.leaderboard) return setTimeout(() => cronLeaderboard(type), 1000 * 60 * 5); // 5m

    try {

        await doTransaction(async (connection, commit, rollback) => {

            const [users] = await connection.query(
                `SELECT SUM(bets.amount) as wagered, users.id, users.username, users.xp FROM bets
                INNER JOIN users ON users.id = bets.userId
                WHERE bets.createdAt >= ? AND bets.completed = 1 AND users.leaderboardBan = 0 AND users.role = 'USER' GROUP BY userId ORDER BY wagered DESC LIMIT 10`,
                [leaderboard.createdAt]
            );

            await connection.query(`UPDATE leaderboards SET endedAt = DATE(?) WHERE id = ?`, [new Date(), leaderboard.id]);

            for (let i = 0; i < users.length; i++) {

                const user = users[i];
                user.position = i + 1;
                user.reward = leaderboards[type].rewards[user.position];

                const [result] = await connection.query('INSERT INTO leaderboardUsers (leaderboardId, userId, position, totalWagered, amountWon, createdAt) VALUES (?, ?, ?, ?, ?, DATE(?))', [leaderboard.id, user.id, user.position, user.wagered, user.reward, new Date()]);
                await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [user.reward, user.id]);
                await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [user.id, user.reward, 'in', 'leaderboard', result.insertId]);
                io.to(user.id).emit('balance', 'add', user.reward); // this is kinda bad, will get executed even if tx rolls back

            }

            leaderboard.users = users;
            await commit();

        });

        delete leaderboards[type].cache;
        sendLog('leaderboard', `\`${type}\` leaderboard ended.\n\n${leaderboard.users.map((u) => `${u.position}. ${u.username} (\`${u.id}\`) - :robux: R$${u.reward}.`).join('\n')}`);

    } catch (e) {
        console.error(e);
    }

    cronLeaderboard(type);

}

module.exports = {
    leaderboards,
    cacheLeaderboards
}