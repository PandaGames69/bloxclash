const io = require('../../server');
const { sql } = require('../../../database');
const { sendSystemMessage, channels } = require('../functions');

module.exports = {
    name: 'lock',
    description: 'Lock the current channel',
    async execute(socket) {

        const [[user]] = await sql.query('SELECT perms FROM users WHERE id = ?', [socket.userId]);
        if (user.perms < 1) return sendSystemMessage(socket, 'Insufficient permissions.');
        channels[socket.channel].locked = true;
        sendSystemMessage(io.to(socket.channel), 'Channel locked.');
        
    }
}