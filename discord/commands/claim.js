const { SlashCommandBuilder } = require('discord.js');
const { doTransaction } = require('../../database');
const { roundDecimal } = require('../../utils');
const io = require('../../socketio/server');

const data = new SlashCommandBuilder()
	.setName('claim')
	.setDescription('Claim your status unclaimed earnings.')

module.exports = {
    data,
    async execute(interaction) {

        try {

            await doTransaction(async (connection, commit) => {

                const discordId = interaction.user.id;

                const [[user]] = await connection.query(
                    `SELECT discordAuths.userId as id, id as discordId, unclaimed, elegible FROM earnUsers LEFT JOIN discordAuths ON discordAuths.discordId = earnUsers.id WHERE id = ? FOR UPDATE`,
                    [discordId]
                );

                if (!user || !user.elegible) {
                    return interaction.reply({ content: 'You are not elegible.', ephemeral: true });
                } else if (!user.id) {
                    return interaction.reply({ content: 'You have not linked your discord account to BloxClash.com yet. You can do so in https://bloxclash.com/profile/settings', ephemeral: true });
                }

                const min = 10;

                if (user.unclaimed < min) {
                    return interaction.reply({ content: `You need at least <:robux:1056759250367565844> R$${min} to claim.`, ephemeral: true });
                }

                const amount = roundDecimal(user.unclaimed);

                const [result] = await connection.query('INSERT INTO earnClaims (earnUserId, amount) VALUES (?, ?)', [user.discordId, amount]);
                await connection.query('UPDATE earnUsers SET unclaimed = 0 WHERE id = ?', [user.discordId]);
                await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, user.id]);

                await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [user.id, amount, 'in', 'earn', result.insertId]);
                await commit();

                interaction.reply({ content: `You have succesfully claimed <:robux:1056759250367565844> R$${amount} robux.`, ephemeral: true });
                io.to(user.id).emit('balance', 'add', amount);

            });

        } catch (e) {
            console.error(e);
            await interaction.reply({ content: `An error has ocurred.`, ephemeral: true });
        }

    }
};