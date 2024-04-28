const { sql, doTransaction } = require('../database');
const { discordClient, discordIds } = require('./index');
const { getRandomInt, hourMs } = require('../utils');
const levels = require('../utils/levels.json')

const reactionEmoji = '🎉';

const giveawayTypes = {
    'daily': {
        amount: 1000,
        minLvl: 3,
        duration: hourMs * 24,
        channel: discordIds.dailyGiveaways,
        img: 'https://i.imgur.com/KXyWBgl.png'
    },
    'weekly': {
        amount: 5000,
        minLvl: 5,
        duration: hourMs * 24 * 7,
        channel: discordIds.weeklyGiveaways,
        img: 'https://i.imgur.com/qLxZu5S.png'
    }
}

async function startGiveaways() {

    const [giveaways] = await sql.query(`SELECT id, amount, type, discordMessageId, createdAt FROM giveaways WHERE endedAt IS NULL`);
    
    for (const giveaway of giveaways) {
        
        const giveawayType = giveawayTypes[giveaway.type];
        if (!giveawayType) return console.error('Giveaway type not found', giveaway.type);
        giveawayType.id = giveaway.id;

        const endsIn = giveaway.createdAt.valueOf() + giveawayType.duration - Date.now();
        setTimeout(() => endGiveaway(giveaway, giveawayType), endsIn);

    }

    Object.keys(giveawayTypes).forEach((type) => {
        if (!giveawayTypes[type].id) startGiveaway(type);
    });
    
}

async function startGiveaway(type) {
    
    const giveawayType = giveawayTypes[type];
    const channel = discordClient.channels.cache.get(giveawayType.channel);
    if (!channel) return console.error('Giveaway channel not found', giveawayType.channel);

    const createdAt = new Date();
    const endsIn = giveawayType.duration;

    // const message = await channel.send(`React with ${reactionEmoji} to participate in the giveaway! Ends on <t:${Math.round((createdAt.valueOf() + endsIn) / 1000)}>`);
    const message = await channel.send({
        "content": `<@&${discordIds.giveawayRole}>`,
        "embeds": [
          {
            "title": `New giveaway - <:robux:1056759250367565844> R$${giveawayType.amount}`,
            "description": `React with ${reactionEmoji} to participate in the giveaway!\nEnds on <t:${Math.round((createdAt.valueOf() + endsIn) / 1000)}>.\n\nRequirements:\n- Have your Discord account linked to **[BloxClash](${process.env.FRONTEND_URL})**.\n- Level ${giveawayType.minLvl} on-site.`,
            "color": 4663446,
            "footer": {
              "text": "BloxClash Giveaways",
              "icon_url": "https://i.imgur.com/zkfQG1M.gif"
            },
            "timestamp": createdAt.toISOString(),
            "image": {
              "url": giveawayType.img
            }
          }
        ],
        "attachments": []
    });
    
    await message.react(reactionEmoji);

    const giveaway = {
        id: null,
        amount: giveawayType.amount,
        type,
        discordMessageId: message.id,
        createdAt
    }

    const [result] = await sql.query(`INSERT INTO giveaways (amount, type, discordMessageId, createdAt) VALUES (?, ?, ?, ?)`, [giveaway.amount, giveaway.type, giveaway.discordMessageId, createdAt]);
    giveaway.id = result.insertId;

    setTimeout(() => endGiveaway(giveaway, giveawayType), endsIn);

}

async function endGiveaway(giveaway, giveawayType) {

    const channel = discordClient.channels.cache.get(giveawayType.channel);
    if (!channel) return console.error('Giveaway channel not found', giveawayType.channel);

    const message = await channel.messages.fetch(giveaway.discordMessageId);
    if (!message) return console.error('Giveaway message not found', giveaway.discordMessageId);

    const reaction = message.reactions.cache.get(reactionEmoji);
    if (!reaction) return console.error('Giveaway reaction not found', reactionEmoji);

    let userCollection = await reaction.users.fetch().catch(() => {});
    if (!userCollection) return console.error('Giveaway users not found');

    while (userCollection.size % 100 === 0) {
        const newUsers = await reaction.users.fetch({ after: userCollection.lastKey() });
        if (newUsers.size === 0) break;
        userCollection = userCollection.concat(newUsers);
    }

    const userIds = userCollection.map(u => u.id);

    const minXp = levels[giveawayType.minLvl];

    try {

        await doTransaction(async (connection, commit, rollback) => {

            const [participants] = await connection.query(`
                SELECT id, discordId FROM users u JOIN discordAuths da ON da.userId = u.id
                WHERE u.xp >= ? AND u.sponsorLock = 0 AND u.role = 'USER' AND u.accountLock = 0 AND da.discordId IN (?)
            `, [minXp, userIds]);

            let winnerId = null;

            if (participants.length) {

                const winner = participants[getRandomInt(0, participants.length - 1)];
                winnerId = winner.id;
                
                await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [giveaway.amount, winnerId]);
                await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [winnerId, giveaway.amount, 'in', 'discord-giveaway', giveaway.id]);

                channel.send(`<@${winner.discordId}> won the giveaway.`);

            } else {
                channel.send('No one who meets the requirements participated in the giveaway :(');
            }

            await connection.query(`UPDATE giveaways SET endedAt = NOW(), winnerId = ? WHERE id = ?`, [winnerId, giveaway.id]);
            await commit();

            startGiveaway(giveaway.type);

        });

    } catch (e) {
        console.error(e);
    }

}

startGiveaways();