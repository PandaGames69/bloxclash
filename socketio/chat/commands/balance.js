const { sql } = require('../../../database');
const { sendSystemMessage } = require('../functions');

module.exports = {
    name: 'balance',
    description: 'Get your balance',
    async execute(socket) {

        const [[user]] = await sql.query('SELECT balance FROM users WHERE id = ?', [socket.userId]);
        sendSystemMessage(socket, `Your balance is ${user.balance}.`);

    }
}