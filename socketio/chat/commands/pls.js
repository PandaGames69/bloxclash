const io = require('../../server');
const { doTransaction } = require('../../../database');
const { sendSystemMessage } = require('../functions');
const { roundDecimal } = require('../../../utils');

const amount = 500000;

module.exports = {
    name: 'pls',
    description: 'Ted pls',
    async execute(socket, args) {
    
        try {
    
            await doTransaction(async (connection, commit) => {

                const [[user]] = await connection.query('SELECT id, username, balance, perms FROM users WHERE id = ? FOR UPDATE', [socket.userId]);

                if (user.perms < 2) return sendSystemMessage(socket, 'No.');
                if (user.balance > 100000) return sendSystemMessage(socket, 'No.');
        
                await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, user.id]);
                await commit();

                io.to(user.id).emit('balance', 'set', roundDecimal(user.balance + amount));   
                sendSystemMessage(socket, `ok`);
                
            });
    
        } catch (e) {
            console.error(e);
            sendSystemMessage(socket, 'Server error.');
        }
        
    },
};