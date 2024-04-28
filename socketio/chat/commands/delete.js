const io = require('../../server');
const { sql } = require('../../../database');
const { sendSystemMessage, channels } = require('../functions');

module.exports = {
    name: 'delete',
    description: 'Delete a message',
    async execute(socket, args) {

        const [[user]] = await sql.query('SELECT id, perms FROM users WHERE id = ?', [socket.userId]);
        if (user.perms < 1) return sendSystemMessage(socket, 'Insufficient permissions.');

        const messageId = args[0];
        if (!messageId) return sendSystemMessage(socket, 'Invalid message.');

        const channel = socket.channel;
        const message = channels[channel].messages.find(x => x.id == messageId);
        if (!message) return sendSystemMessage(socket, 'Invalid message.');

        await sql.query('UPDATE chatMessages SET deletedAt = NOW() WHERE id = ?', [messageId]);
        channels[channel].messages = channels[channel].messages.filter(x => x.id != messageId);

        io.to(channel).emit('chat:deleteMessage', messageId);

    }
}