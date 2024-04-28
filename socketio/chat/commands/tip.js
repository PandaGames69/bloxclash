const io = require('../../server');
const { doTransaction } = require('../../../database');
const { sendSystemMessage } = require('../functions');
const { roundDecimal, sendLog, newNotification, getUserLevel } = require('../../../utils');
const { enabledFeatures, checkAccountLock } = require('../../../routes/admin/config');

function sendMessage(socket, message, type = 'error', userId) {
    io.to(userId || socket.userId).emit('toast', type, message);
    return sendSystemMessage(socket, message);
}

module.exports = {
    name: 'tip',
    description: 'Tip to a user',
    async execute(socket, args) {

        if (!enabledFeatures.tips) return sendMessage(socket, `Tipping is disabled.`);

        let toUserId = args[0];
        if (!toUserId || toUserId.length > 32 || toUserId.length < 3 || !/^[A-Za-z0-9_]*$/.test(toUserId)) return sendMessage(socket, 'Invalid username.');

        let amount = parseFloat(args[1]);
        if (!amount || isNaN(amount)) return sendMessage(socket, 'Invalid amount.');
        
        amount = roundDecimal(amount);
        if (amount < 5) return sendMessage(socket, 'The minimum tip amount is R$5.');
    
        try {
    
            await doTransaction(async (connection, commit) => {

                const [[user]] = await connection.query('SELECT id, username, xp, balance, tipBan, tipAllowance, maxPerTip, maxTipPerUser, accountLock, sponsorLock, verified FROM users WHERE id = ? FOR UPDATE', [socket.userId]);
                if (amount > user.balance) return sendMessage(socket, 'Insufficient balance.');
       
                if (!user.sponsorLock) {
                    const [[deposited]] = await connection.query('SELECT SUM(amount) as total FROM transactions WHERE userId = ? AND type = ? AND createdAt > ?', [socket.userId, 'deposit', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)]);
                    if (!deposited?.total || deposited.total < 200) return sendMessage(socket, 'You need to have deposited at least R$200 in the last 2 weeks to tip.');
                }

                const level = getUserLevel(user.xp);
                if (level < 5) return sendMessage(socket, 'You need to be at least level 5 to tip.');
                
                user.accountLock = await checkAccountLock(user);
                if (user.tipBan || user.accountLock) return sendMessage(socket, 'You are banned from tipping.');
    
                if (user.tipAllowance != null && amount > user.tipAllowance) {
                    return sendMessage(socket, user.tipAllowance ? `You can only tip R$${user.tipAllowance} more before exceeding your tip limit.` : 'You have reached your tip limit.');
                }
    
                if (user.maxPerTip != null && amount > user.maxPerTip) {
                    return sendMessage(socket, `You can only tip a maximum of R$${user.maxPerTip} per tip.`);
                }
    
                const [[toUser]] = await connection.query('SELECT id, username, balance FROM users WHERE LOWER(username) = LOWER(?)', [toUserId]);
                if (!toUser) return sendMessage(socket, 'User not found.');
                if (toUser.id === user.id) return sendMessage(socket, 'You can\'t tip yourself.');
        
                if (user.maxTipPerUser != null) {
                    const [[{ totalTipped }]] = await connection.query('SELECT SUM(amount) AS totalTipped FROM tips WHERE fromUserId = ? AND toUserId = ?', [user.id, toUser.id]);
                    if (totalTipped + amount > user.maxTipPerUser) return sendMessage(socket, `You previously tipped R$${totalTipped} to this user, you can only tip a total of R$${user.maxTipPerUser} to each user.`);
                }
    
                if (user.tipAllowance != null) {
                    await connection.query('UPDATE users SET balance = balance - ?, tipAllowance = tipAllowance - ? WHERE id = ?', [amount, amount, user.id]);
                } else {
                    await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, user.id]);
                }
    
                await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, toUser.id]);
    
                const [tipResult] = await connection.query('INSERT INTO tips (fromUserId, toUserId, amount) VALUES (?, ?, ?)', [user.id, toUser.id, amount]);
        
                const [txResult] = await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES ?', [[
                    [toUser.id, amount, 'in', 'tip', tipResult.insertId],
                    [user.id, amount, 'out', 'tip', tipResult.insertId]
                ]]);
    
                await newNotification(toUser.id, 'tip-received', {
                    txId: txResult.insertId,
                    amount,
                    fromUser: {
                        id: user.id,
                        username: user.username,
                        xp: user.xp
                    }
                }, connection);
    
                await commit();
        
                io.to(user.id).emit('balance', 'set', roundDecimal(user.balance - amount));    
                io.to(toUser.id).emit('balance', 'set', roundDecimal(toUser.balance + amount));
    
                sendMessage(socket, `You tipped R$${amount} to ${toUser.username}`, 'success');
                sendMessage(io.to(toUser.id), `${user.username} Tipped you R$${amount}`, 'success', toUser.id);
                sendLog('tips', `*${user.username}* (\`${user.id}\`) tipped *${toUser.username}* (\`${toUser.id}\`) :robux:R$${amount}`);

            });

        } catch (e) {
            console.error(e);
            sendMessage(socket, 'Server error.');
        }
        
    },
};