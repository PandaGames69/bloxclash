const { rains, rainInterval } = require('../../rain');
const io = require('../../server');
const { doTransaction } = require('../../../database');
const { sendSystemMessage } = require('../functions');
const { roundDecimal, sendLog } = require('../../../utils');
const { enabledFeatures, checkAccountLock } = require('../../../routes/admin/config');

module.exports = {
    name: 'rain',
    description: 'Start a rain',
    async execute(socket, args) {

        if (!enabledFeatures.rain) return sendSystemMessage(socket, `Rains are disabled.`);

        if (rains.user) {
            return sendSystemMessage(socket, `There is a user rain in progress, you can't host a rain right now.`);
        }

        if (rains.system.joinable) {
            return sendSystemMessage(socket, `There is a system rain in progress, you can't host a rain right now.`);
        }

        const systemRainEndsIn = rains.system.createdAt.valueOf() + rains.systemRainDuration - Date.now();

        if (systemRainEndsIn < (rains.joinTime + 30000)) {
            return sendSystemMessage(socket, `A system rain is incoming, you can't host a rain right now.`);
        }

        const amount = parseInt(args[0]);
        if (!amount || isNaN(amount) || amount < 100) return sendSystemMessage(socket, 'Invalid amount.');

        try {

            await doTransaction(async (connection, commit) => {

                const [[user]] = await connection.query('SELECT id, username, balance, xp, tipBan, rainBan, rainTipAllowance, sponsorLock, accountLock, verified FROM users WHERE id = ? FOR UPDATE', [socket.userId]);
                if (amount > user.balance) return sendSystemMessage(socket, 'Insufficient balance.');

                if (user.rainTipAllowance != null && amount > user.rainTipAllowance) {
                    return sendSystemMessage(socket, `You can only host a rain of R$${user.rainTipAllowance} before exceeding your limit.`);
                }

                user.accountLock = await checkAccountLock(user);
                if (user.rainBan || user.tipBan || user.accountLock) return sendSystemMessage(socket, 'You are banned from hosting rains.');

                if (user.rainTipAllowance == null) {
                    await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, user.id]);
                } else {
                    await connection.query('UPDATE users SET balance = balance - ?, rainTipAllowance = rainTipAllowance - ? WHERE id = ?', [amount, amount, user.id]);
                }

                const now = new Date();
                const [result] = await connection.query('INSERT INTO rains (host, amount, createdAt) VALUES (?, ?, ?)', [user.id, amount, now]);
                await commit();

                const rain = {
                    id: result.insertId,
                    host: {
                        id: user.id,
                        username: user.username,
                        xp: user.xp
                    },
                    users: [],
                    amount,
                    createdAt: now,
                    endedAt: null
                };

                rains.user = rain;
                rainInterval(rain);

                io.to(user.id).emit('balance', 'set', roundDecimal(user.balance - amount));
                sendLog('rain', `New user rain hosted by *${user.username}* (\`${user.id}\`) - :robux: R$${amount} (#${result.insertId})`);

            });

        } catch (e) {
            console.error(e);
            sendSystemMessage(socket, 'An error occurred.');
        }
        
    },
};