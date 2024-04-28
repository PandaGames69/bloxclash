const io = require('../server');
const { sendSystemMessage, channels, newMessage } = require('./functions');
const { bannedPhrases, bannedUsers } = require('../../routes/admin/config');
const { sql } = require('../../database');
const path = require('path');
const { enabledFeatures } = require('../../routes/admin/config');

const fs = require('fs');
const commands = new Map();
const cooldowns = new Map();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
}

const cmdPrefix = '/';

setInterval(() => {

    const now = Date.now();

    for (const [userId, cooldown] of cooldowns.entries()) {
        if (cooldown < now) {
            cooldowns.delete(userId);
        }
    }

}, 60000);

async function joinChat(socket, channel) {
        
    if (channel == 'VIP') {

        if (!socket.userId) return sendSystemMessage(socket, `You need to be logged in to join this room.`);
        const [[user]] = await sql.query('SELECT balance FROM users WHERE id = ?', [socket.userId]);
        if (user?.balance < 100000) return sendSystemMessage(socket, `Only VIPs can join this room.`);

    } else {
        if (!channels[channel]) return socket.emit('chat:join', { error: 'INVALID_CHANNEL' });
    }

    if (socket.channel) socket.leave(socket.channel);

    socket.channel = channel;
    socket.join(socket.channel);
    socket.emit('chat:join', { success: true, channel });
    socket.emit('chat:pushMessage', channels[channel].messages);
    
}

async function sendMessage(socket, message, replyTo) {

    if (!socket.userId) return sendSystemMessage(socket, `You need to be logged in to chat.`);
    if (bannedUsers.has(socket.userId)) return sendSystemMessage(socket, `You are banned.`)

    if (!socket.channel) return sendSystemMessage(socket, `You got disconnected, refresh the site.`); // You haven't joined any chat rooms.
    if (!message || typeof message != 'string' || message.length > 1000) return sendSystemMessage(socket, `Invalid message.`);

    if (message.startsWith(cmdPrefix)) {

        if (replyTo) return sendSystemMessage(socket, 'You can\'t reply with a command.');

        const args = message.slice(cmdPrefix.length).trim().split(/ +/g);
        const commandName = args.shift().toLowerCase();
        
        if (['earn', 'claim'].includes(commandName)) {
            return sendSystemMessage(socket, 'You have to use this command on Discord.');
        }

        if (!commands.has(commandName)) {
            return sendSystemMessage(socket, 'Unknown command.');
        }

        const command = commands.get(commandName);

        try {
            command.execute(socket, args);
        } catch (error) {
            console.error(error);
            sendSystemMessage(socket, 'There was an error trying to execute that command!');
        }

    } else {

        if (!enabledFeatures.chat) return sendSystemMessage(socket, 'Chat is disabled.');
        if (message.length > 300) return sendSystemMessage(socket, 'Message is too long.');

        const [[user]] = await sql.query('SELECT id, username, xp, role, perms, mutedUntil FROM users WHERE id = ?', [socket.userId]);
        const now = Date.now();

        if (user.perms < 1) {

            if (user.xp < 200) {
                return sendSystemMessage(socket, '200 wagered required to chat');
            }

            const cooldown = cooldowns.get(socket.userId);
            if (cooldown && cooldown > now) return sendSystemMessage(socket, `You are on cooldown. Please wait ${Math.ceil((cooldown - now) / 1000)} seconds.`);
    
            cooldowns.set(socket.userId, now + 2000);

            if (channels[socket.channel].locked) return sendSystemMessage(socket, 'Channel is locked.');

        }

        if (user.mutedUntil && new Date(user.mutedUntil).valueOf() > now) return sendSystemMessage(socket, 'You are muted.');

        // console.log(socket.channel, message);

        if (socket.channel == 'BEG') {
            if (!message.split(' ').some(word => word.toLowerCase().includes('pls'))) return sendSystemMessage(socket, 'All messages sent to Begging Channel must include "pls".');
        }

        const bannedWords = Object.values(bannedPhrases).map(e => e.toLowerCase());
        if (bannedWords.some(e => message.toLowerCase().includes(e))) return sendSystemMessage(socket, 'Your message contains a banned phrase.');

        if (replyTo) {

            const message = channels[socket.channel].messages.find(e => e.id == replyTo);
            if (!message) return sendSystemMessage(socket, 'Message not found.');

            if (message.type != 'user') return sendSystemMessage(socket, 'You can\'t reply to a system message.');

            // if (user.perms < 1) {
            //     if (message.senderId == user.id) return sendSystemMessage(socket, 'You can\'t reply to your own message.');

            //     const mentions = message.content.match(/@([A-Za-z0-9]+)/g);
            //     if (!mentions || !mentions.some(e => e.slice(1) == user.username)) return sendSystemMessage(socket, 'You can\'t reply to this message.');   
            // }

        }

        const mentions = message.match(/@([A-Za-z0-9_]+)/g);

        if (mentions) {

            for (let i = 0; i < mentions.length; i++) {

                const mention = mentions[i].slice(1);

                const [[mentionedUser]] = await sql.query('SELECT id, username, mentionsEnabled FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1', [mention]);
                if (!mentionedUser) return sendSystemMessage(socket, `@${mention} not found.`);
                if (!mentionedUser.mentionsEnabled) return sendSystemMessage(socket, `@${mentionedUser.username} has mentions disabled.`);

                message = message.replace(`@${mention}`, `@${mentionedUser.username}`);

            }

        }

        const [result] = await sql.query('INSERT INTO chatMessages(type, senderId, content, channelId, replyTo) VALUES (?, ?, ?, ?, ?)', ['user', user.id, message, socket.channel, replyTo]);

        newMessage({
            id: result.insertId,
            content: message,
            type: 'user',
            createdAt: now,
            replyTo: replyTo,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                xp: user.xp
            }
        }, socket.channel);
    
        // socket.emit('chat:sendMessage', { success: true });
    
    }

}

module.exports = {
    joinChat,
    sendMessage
}