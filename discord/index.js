const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sql } = require('../database');

const discordIds = {
	guild: '1054247862646603826',
	earnChannel: '1142463018089844938',
	earnLogsChannel: '1143219861791711323',
	earnRole: '1143203146949218375',
	earnMessage: '1142465265641197568',
	clashClub: '1156162231709474847',
	dailyGiveaways: '1157311658893525063',
	weeklyGiveaways: '1157311699779600556',
	giveawayRole: '1132678038694404147'
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences] });
client.login(process.env.DISCORD_BOT_TOKEN);

client.once(Events.ClientReady, c => {

	console.log(`Discord Client Ready! Logged in as ${c.user.tag}`);
	client.bloxClashGuild = client.guilds.cache.get(discordIds.guild);

	if (process.env.NODE_ENV == 'production') {
		require('./earn');
		require('./clashclub');
		require('./giveaways');
	}

});
	
if (process.env.NODE_ENV == 'production') {

	client.commands = new Collection();
	
	const commandsPath = path.join(__dirname, 'commands');
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
	
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
	
	client.on(Events.InteractionCreate, async interaction => {
		if (!interaction.isChatInputCommand()) return;
	
		const command = interaction.client.commands.get(interaction.commandName);
	
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
	
		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	});

}

module.exports = {
	discordClient: client,
	discordIds
}