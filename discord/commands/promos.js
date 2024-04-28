const { SlashCommandBuilder } = require('discord.js');
const { sql } = require('../../database');

const data = new SlashCommandBuilder()
	.setName('promos')
	.setDescription('Staff only. See active promo codes.')

module.exports = {
    data,
    async execute(interaction) {

        const discordId = interaction.user.id;

        const [[user]] = await sql.query(
            `SELECT discordAuths.userId as discordId, id, username, perms FROM users LEFT JOIN discordAuths ON discordAuths.userId = users.id WHERE discordId = ? FOR UPDATE`,
            [discordId]
        );

        if (!user || !user.perms || user.perms < 2) {
            return interaction.reply({ content: 'You are not allowed to run this command.', ephemeral: true });
        }

        const [promos] = await sql.query(`
            SELECT code, currentUses, totalUses, amount, minLvl, clashClub FROM promoCodes ORDER BY amount DESC
        `);

        if (!promos.length) {
            return interaction.reply({ content: 'There are no active promo codes.', ephemeral: true });
        }

        const text = promos.map(promo => `**${promo.code}** (\`${promo.currentUses}/${promo.totalUses}\` uses, R$${promo.amount} reward${promo.minLvl ? `, min level ${promo.minLvl}` : ''}${promo.clashClub ? ', Clash Club' : ''})`).join('\n');
        await interaction.reply({ content: text, ephemeral: true });

    }
};