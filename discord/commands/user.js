const { SlashCommandBuilder } = require('discord.js');
const { sql } = require('../../database');

const data = new SlashCommandBuilder()
	.setName('user')
	.setDescription('Staff only. Get a BloxClash user Discord linkage.')
    .addStringOption(option =>
		option.setName('id')
			.setDescription('Roblox username or ID, Discord mention or ID.')
            .setRequired(true)
    );

module.exports = {
    data,
    async execute(interaction) {

        const adminDiscordId = interaction.user.id;

        const [[admin]] = await sql.query(
            `SELECT perms FROM users LEFT JOIN discordAuths ON discordAuths.userId = users.id WHERE discordId = ?`,
            [adminDiscordId]
        );

        if (!admin || !admin.perms || admin.perms < 2) {
            return interaction.reply({ content: 'You are not allowed to run this command.', ephemeral: true });
        }

        let id = interaction.options.getString('id').trim();

        if (id.startsWith('<@') && id.endsWith('>')) {
            id = id.slice(2, -1);
            if (id.startsWith('!')) id = id.slice(1);
        }

        const [[user]] = await sql.query(`
            SELECT users.id, users.username, discordAuths.discordId FROM users
            LEFT JOIN discordAuths ON discordAuths.userId = users.id
            WHERE users.id = ? OR LOWER(users.username) = LOWER(?) OR discordAuths.discordId = ?
        `, [id, id, id]);

        if (!user) {
            return interaction.reply({ content: 'User not found.', ephemeral: true });
        }

        const text = `**${user.username}** (\`${user.id}\`) ${user.discordId ? `is linked to <@${user.discordId}>` : 'hasn\'t linked a Discord account'}.`;
        await interaction.reply({ content: text, ephemeral: true });

    }
};