const { sql } = require('../../../database');
const { sendSystemMessage } = require('../functions');
const io = require('../../server');

module.exports = {
    name: 'mute',
    description: 'Mute a user',
    async execute(socket, args) {

        let toId = args[0];
        if (!toId || toId.length > 32 || toId.length < 3 || !/^[A-Za-z0-9_]*$/.test(toId)) return sendSystemMessage(socket, 'Invalid username.');

        const [[toUser]] = await sql.query('SELECT id, username, perms FROM users WHERE username = ? OR id = ? LIMIT 1', [toId, toId]);
        if (!toUser) return sendSystemMessage(socket, 'User not found.');

        const [[user]] = await sql.query('SELECT id, perms FROM users WHERE id = ?', [socket.userId]);
        if (toUser.id == user.id) return sendSystemMessage(socket, 'You can\'t mute yourself.');
        if (toUser.perms >= user.perms) return sendSystemMessage(socket, 'Insufficient permissions.');

        let duration = parseInt(args[1]);
        if (!duration || isNaN(duration) || !Number.isInteger(duration) || duration < 1 || duration > 315400000) return sendSystemMessage(socket, 'Invalid duration.');
        await sql.query('UPDATE users SET mutedUntil = ? WHERE id = ?', [new Date(Date.now() + duration * 1000), toUser.id]);

        sendSystemMessage(socket, `You muted @${toUser.username} for ${duration} seconds.`);
        sendSystemMessage(io.to(toUser.id), `You were muted for ${duration} seconds.`);
        
    }
}