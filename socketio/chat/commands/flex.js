const { doTransaction } = require('../../../database');
const { sendSystemMessage, newMessage } = require('../functions');

module.exports = {
    name: 'flex',
    description: 'Flex your balance',
    async execute(socket) {

        try {

            await doTransaction(async (connection, commit) => {

                const [[user]] = await connection.query('SELECT id, username, role, xp, balance FROM users WHERE id = ? FOR UPDATE', [socket.userId]);
                if (user.balance < 100000) return sendSystemMessage(socket, 'Insufficient balance.');
    
                const [[lastFlex]] = await connection.query('SELECT createdAt FROM chatMessages WHERE senderId = ? AND type = ? ORDER BY id DESC LIMIT 1 FOR UPDATE', [user.id, 'flex']);
                if (lastFlex && lastFlex.createdAt > Date.now() - 60000 * 15) return sendSystemMessage(socket, 'You can only flex once every 15m.');
    
                const [result] = await connection.query('INSERT INTO chatMessages(type, senderId, content, channelId) VALUES (?, ?, ?, ?)', ['flex', user.id, user.balance, socket.channel]);
                await commit();

                newMessage({
                    id: result.insertId,
                    content: user.balance,
                    type: 'flex',
                    createdAt: Date.now(),
                    replyTo: null,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        xp: user.xp
                    }
                }, socket.channel)

            });
        
        } catch (e) {
            console.error(e);
            sendSystemMessage(socket, 'An error occurred.');
        }
        
    }
}