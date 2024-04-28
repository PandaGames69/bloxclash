const { sql } = require('../../database');
const io = require('../../socketio/server');

const rewards = {};

const topReward = 500;
const limit = 15;

async function cacheSurveys(top = false) {

    const [results] = await sql.query(`
        SELECT userId, username, xp, provider, robux FROM surveys JOIN users ON surveys.userId = users.id
        ${top ? `WHERE robux > ${topReward}` : ''} ORDER BY surveys.id DESC LIMIT ${limit}
    `);

    rewards[top ? 'top' : 'all'] = results.map(e => {

        return {
            user: {
                id: e.userId,
                username: e.username,
                xp: e.xp
            },
            robux: e.robux,
            provider: e.provider,
            top: e.robux >= topReward
        }
        
    });

    if (!top) await cacheSurveys(true);

}

function newReward(user, provider, robux) {

    const data = {
        user: {
            id: user.id,
            username: user.username,
            xp: user.xp
        },
        robux: robux,
        provider: provider,
        top: robux >= topReward
    }

    rewards.all.unshift(data);
    if (rewards.all.length > limit) {
        rewards.all.splice(-(rewards.all.length - limit));
    }

    if (data.top) {
        rewards.top.unshift(data);
        if (rewards.top.length > limit) {
            rewards.top.splice(-(rewards.top.length - limit));
        }
    }

    io.to('surveys').except(user.id).emit('surveys:rewards', [data]);

}

module.exports = {
    newReward,
    cacheSurveys,
    rewards
}