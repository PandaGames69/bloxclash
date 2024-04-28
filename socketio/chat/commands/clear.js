const io = require('../../server');
const { sql } = require('../../../database');
const { sendSystemMessage, newMessage, channels } = require('../functions');

module.exports = {
    name: 'clear',
    description: 'Clear the current channel',
    async execute(socket) {

        const [[user]] = await sql.query('SELECT id, perms FROM users WHERE id = ?', [socket.userId]);
        if (user.perms < 1) return sendSystemMessage(socket, 'Insufficient permissions.');

        const [result] = await sql.query('INSERT INTO chatMessages(type, senderId, channelId) VALUES (?, ?, ?)', ['clear', user.id, socket.channel]);

        io.to(socket.channel).emit('chat:clear', { cleared: true });
        channels[socket.channel].messages = [];

        newMessage({
            id: result.insertId,
            type: 'system',
            content: 'Chat cleared.',
            createdAt: Date.now(),
            replyTo: null,
            user: null
        }, socket.channel)

    }
}