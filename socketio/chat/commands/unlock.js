const io = require('../../server');
const { sql } = require('../../../database');
const { sendSystemMessage, channels } = require('../functions');

module.exports = {
    name: 'unlock',
    description: 'Unlock the current channel',
    async execute(socket) {

        const [[user]] = await sql.query('SELECT perms FROM users WHERE id = ?', [socket.userId]);
        if (user.perms < 1) return sendSystemMessage(socket, 'Insufficient permissions.');
        channels[socket.channel].locked = false;
        sendSystemMessage(io.to(socket.channel), 'Channel unlocked.');

    }
}