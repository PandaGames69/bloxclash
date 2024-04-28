const { SlashCommandBuilder } = require('discord.js');
const { sql } = require('../../database');
const { roundDecimal } = require('../../utils');

const data = new SlashCommandBuilder()
	.setName('earn')
	.setDescription('Check earn unclaimed earnings.')
    .addUserOption(option =>
		option.setName('user')
			.setDescription('User you want to check the earnings of.'));

module.exports = {
    data,
    async execute(interaction) {

        const userDs = interaction.options.getUser('user') || interaction.user;
        const me = userDs.id === interaction.user.id;

        const [[user]] = await sql.query('SELECT id, unclaimed, elegible FROM earnUsers WHERE id = ?', [userDs.id]);

        if (!user || !user.elegible) {

            let text = `${me ? 'You are' : `<@${userDs.id}> is`} not ${user ? 'elegible' : 'participating'}.`;

            if (me) {
                const channel = `<#1142463018089844938>`;
                text += ` ${user ? `You can try to authorize again later on ${channel}` : `Check for your elegibility first by following the steps on ${channel}`}.`
            }

            return await interaction.reply({ content: text, ephemeral: true });
            
        }

        await interaction.reply({ content: `${me ? 'You have' : `<@${user.id}> has`} <:robux:1056759250367565844> R$${roundDecimal(user.unclaimed)} unclaimed.`, ephemeral: true });

    }
};