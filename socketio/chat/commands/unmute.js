const { sql } = require('../../../database');
const io = require('../../server');
const { sendSystemMessage } = require('../functions');

module.exports = {
    name: 'unmute',
    description: 'Unmute a user',
    async execute(socket, args) {

        let toId = args[0];
        if (!toId || toId.length > 32 || toId.length < 3 || !/^[A-Za-z0-9]*$/.test(toId)) return sendSystemMessage(socket, 'Invalid username.');

        const [[toUser]] = await sql.query('SELECT id, username, perms FROM users WHERE username = ? OR id = ? LIMIT 1', [toId, toId]);
        if (!toUser) return sendSystemMessage(socket, 'User not found.');

        const [[user]] = await sql.query('SELECT id, perms FROM users WHERE id = ?', [socket.userId]);
        if (toUser.id == user.id) return sendSystemMessage(socket, 'You can\'t mute yourself.');
        if (toUser.perms >= user.perms) return sendSystemMessage(socket, 'Insufficient permissions.');

        await sql.query('UPDATE users SET mutedUntil = ? WHERE id = ?', [null, toUser.id]);

        sendSystemMessage(socket, `You unmuted @${toUser.username}.`);
        sendSystemMessage(io.to(toUser.id), `You were unmuted.`);
        
    }
}