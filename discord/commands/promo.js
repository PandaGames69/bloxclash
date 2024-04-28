const { SlashCommandBuilder } = require('discord.js');
const { doTransaction } = require('../../database');
const { sendLog } = require('../../utils');

const data = new SlashCommandBuilder()
	.setName('promo')
	.setDescription('Staff only. Create a promo code for BloxClash.')
    .addStringOption(option =>
		option.setName('promocode')
			.setDescription('The promocode to create.')
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName("uses")
            .setDescription("Max uses")
            .setMinValue(1)
            .setMaxValue(10000)
            .setRequired(true)
    )
    .addNumberOption(option =>
        option.setName("reward")
            .setDescription("Amount of robux to give")
            .setMinValue(1)
            .setMaxValue(10000)
            .setRequired(true)
    )
    .addNumberOption(option =>
        option.setName("level")
            .setDescription("Minimum level to redeem")
            .setMinValue(0)
            .setMaxValue(100)
    );

module.exports = {
    data,
    async execute(interaction) {

        try {

            await doTransaction(async (connection, commit) => {

                const discordId = interaction.user.id;

                const [[user]] = await connection.query(
                    `SELECT discordAuths.userId as discordId, id, username, perms FROM users LEFT JOIN discordAuths ON discordAuths.userId = users.id WHERE discordId = ? FOR UPDATE`,
                    [discordId]
                );

                if (!user || !user.perms || user.perms < 2) {
                    return interaction.reply({ content: 'You are not allowed to run this command.', ephemeral: true });
                }

                const promocode = interaction.options.getString('promocode').trim();

                const [[existingPromo]] = await connection.query(
                    `SELECT id FROM promoCodes WHERE LOWER(code) = LOWER(?)`,
                    [promocode]
                );

                if (existingPromo) {
                    return interaction.reply({ content: 'This promocode already exists.', ephemeral: true });
                }

                const uses = interaction.options.getInteger('uses');
                const reward = interaction.options.getNumber('reward');
                const level = interaction.options.getNumber('level') || 0;

                await connection.query(
                    `INSERT INTO promoCodes (code, totalUses, amount, minLvl) VALUES (?, ?, ?, ?)`,
                    [promocode, uses, reward, level]
                );
                
                await commit();
                sendLog('promo', `New promo code created by *${user.username}* (\`${user.id}\`) - *${promocode}* (${uses} uses, ${reward} robux, ${level} min level)`);
                return interaction.reply({ content: `\`${promocode}\` has been created.`, ephemeral: true });

            });

        } catch (e) {
            console.error(e);
            await interaction.reply({ content: `An error has ocurred.`, ephemeral: true });
        }

    }
};