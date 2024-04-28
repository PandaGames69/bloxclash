const { sql, doTransaction } = require('../../database');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { discordClient, discordIds } = require('../index');
const { sendLog } = require('../../utils');

const speed = 20; // 4;
const payoutEvery = (1000 * 60 * 60) / speed; // 1 hour
const totalPayout = (85) / speed; // give away every payoutEvery

async function startEarn() {

    const guild = await discordClient.guilds.fetch(discordIds.guild);
    await guild.members.fetch();

    const [[lastPayout]] = await sql.query('SELECT createdAt FROM earnPayouts ORDER BY createdAt DESC LIMIT 1');
    if (!lastPayout || Date.now() - lastPayout.createdAt > payoutEvery) return makePayout();

    const nextPayoutIn = payoutEvery - (Date.now() - lastPayout.createdAt);
    setTimeout(makePayout, nextPayoutIn);

}

startEarn();

discordClient.on('presenceUpdate', async (oldPresence, newPresence) => {

    const earner = newPresence.status != 'offline' && newPresence.activities.some(e => e.state?.toLowerCase().includes('bloxclash'));
    const hasRole = newPresence.member.roles.cache.has(discordIds.earnRole);

    if (earner) {
        if (!hasRole) {
            const [[existing]] = await sql.query('SELECT id FROM earnUsers WHERE id = ? AND elegible = 1', [newPresence.user.id]);
            if (existing) {
                newPresence.member.roles.add(discordIds.earnRole);
            }
        }
    } else {
        if (hasRole) {
            newPresence.member.roles.remove(discordIds.earnRole);
        }
    }

});

async function makePayout() {

    try {

        const guild = await discordClient.guilds.fetch(discordIds.guild);

        const now = Date.now();
        const members = await guild.members.fetch({
            withPresences: true,
            time: 500
        });
    
        // console.log(`Guild members fetched in ${Date.now() - now}ms`);
    
        const discordEarners = members.filter(e => e.presence?.status != 'offline' && e.presence?.activities.some(e => e.state?.toLowerCase().includes('bloxclash')));
        const [whitelistedEarners] = await sql.query('SELECT id FROM earnUsers WHERE id IN (?) AND elegible = 1', [discordEarners.map(e => e.id)]);
        const earners = [];
    
        whitelistedEarners.forEach(e => {
            const member = discordEarners.get(e.id);
            if (member) earners.push(e.id);
        });
    
        const amountPerUser = earners.length ? +((totalPayout / earners.length).toFixed(3)) : 0;
    
        try {
    
            const id = await doTransaction(async (connection, commit, rollback) => {
    
                const [result] = await connection.query('INSERT INTO earnPayouts (amount, usersCount) VALUES (?, ?)', [amountPerUser, earners.length]);
                const id = result.insertId;
        
                if (earners.length) {
                    const earnPayoutUsers = earners.map(e => [id, e]);
                    await connection.query('INSERT INTO earnPayoutUsers (earnPayoutId, earnUserId) VALUES ?', [earnPayoutUsers]);
            
                    await connection.query('UPDATE earnUsers SET unclaimed = unclaimed + ?, farming = 1 WHERE id IN (?)', [amountPerUser, earners]);
                    await connection.query('UPDATE earnUsers SET farming = 0 WHERE id NOT IN (?)', [earners]);
                } else {
                    await connection.query('UPDATE earnUsers SET farming = 0');
                }
        
                await commit();
                return id;

            });
    
            sendLog('earn', `Payout #${id} made to ${earners.length} users, :robux: R$${amountPerUser} each.`)
    
            // const usernames = earners.map(e => `<@${e}>`).join(', ');
            discordClient.channels.cache.get(discordIds.earnLogsChannel).send(`Payout #${id} made to ${earners.length} users, R$${amountPerUser} each.`);
            updateEarnMessage(earners.length);

        } catch (e) {
            console.error(e);
        }
    
        const role = await guild.roles.fetch(discordIds.earnRole);
    
        for (const member of discordEarners.values()) {
            
            const hasRole = member.roles.cache.has(role.id);
    
            try {
                if (earners.includes(member.id)) {
                    if (!hasRole) {
                        await guild.members.addRole({ user: member.id, role: role.id });
                    }
                }
            } catch (e) {
                console.log(e);
            }
    
        }
    
        for (const member of role.members.values()) {
    
            try {
                if (!earners.includes(member.id)) {
                    await guild.members.removeRole({ user: member.id, role: role.id });
                }
            } catch (e) {
                console.log(e);
            }
    
        }

    } catch (e) {
        console.error('Error on makePayout', e);
    }

    setTimeout(makePayout, payoutEvery)

}

async function updateEarnMessage(earnersLength) {
	
	const login = new ButtonBuilder()
	.setLabel('Login with Discord')
	.setURL(`${process.env.BASE_URL}/discord/earn`)
	.setStyle(ButtonStyle.Link);

	
	const row = new ActionRowBuilder()
			.addComponents(login);

	setInterval(async () => {

		const earnChannel = discordClient.channels.cache.get(discordIds.earnChannel);
		const earnMessage = await earnChannel.messages.fetch(discordIds.earnMessage);

        const reward = 85 / (earnersLength + 1);

		earnMessage.edit({
			embeds: [
				{
				  "title": "Want to earn free robux?",
				  "description": `You can add \`.gg/bloxclash\` to your Discord status and earn **R$${reward.toFixed(2)} <:robux:1056759250367565844>** per hour.\n\nClick on the button below to link your account and see if you're elegible to participate.\n\nIf you're not eligible at this current time, you can always check & try again later.`,
				  "color": 6232565,
				  "image": {
					"url": "https://cdn.discordapp.com/attachments/1056870847647858688/1142581728691621938/Announcement_1.png"
				  }
				}
			],
			components: [row]
		});

	}, 30000);

}