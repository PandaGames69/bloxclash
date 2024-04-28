const { formatConsoleError, getRobloxApiInstance, sendLog, newNotification, roundDecimal } = require('../../../utils');
const { getAgent } = require('../../../utils/proxies');
const { getCurrentUser } = require('../../../utils/roblox');
const { enabledFeatures, depositBonus } = require('../../admin/config');
const { sql, doTransaction } = require('../../../database');
const io = require('../../../socketio/server');

const FormData = require('form-data');
const { default: PQueue } = require('p-queue');

const robuxExchange = {
    queue: new PQueue({ concurrency: 1, timeout: 240000 }),
    transactions: [],
    currentTransactions: []
}

async function processQueue() {

    // console.log(enabledFeatures);

    if (!enabledFeatures.robuxDeposits || !enabledFeatures.robuxWithdrawals) {
        return setTimeout(() => {
            robuxExchange.queue.add(processQueue);
        }, 60000 * 2); // recheck in 2m
    }

    const [exchanges] = await sql.query('SELECT id, userId, filledAmount, totalAmount, operation, status FROM robuxExchanges WHERE status = ? ORDER BY id ASC', ['pending']);
    // console.log(exchanges);

    robuxExchange.transactions = exchanges;

    const deposits = robuxExchange.transactions.filter(e => e.operation === 'deposit');

    for (const deposit of deposits) {

        if (deposit.status !== 'pending') continue;

        robuxExchange.currentTransactions[0] = deposit.id;
        const withdraws = robuxExchange.transactions.filter(e => e.userId !== deposit.userId && e.operation == 'withdraw');
        if (!withdraws.length) continue;

        const [[depositor]] = await sql.query('SELECT id, robloxCookie, proxy FROM users WHERE id = ?', [deposit.userId]);
        
        while (withdraws.length) {

            const withdraw = withdraws.shift();
            if (withdraw.status !== 'pending') continue;
            robuxExchange.currentTransactions[1] = withdraw.id;

            const depositorHttpsAgent = getAgent(depositor.proxy);
            const depositorRobloxUser = await getCurrentUser(depositor.robloxCookie, depositorHttpsAgent);

            const remaining = (deposit.totalAmount - deposit.filledAmount);
            if (!depositorRobloxUser || depositorRobloxUser.RobuxBalance < remaining) {
                
                if (!depositorRobloxUser) {
                    sendLog('robuxExchange', `Deposit #${deposit.id} failed - Invalid roblox cookie`);
                } else {
                    sendLog('robuxExchange', `Deposit #${deposit.id} failed - Roblox account does not have enough robux`);
                }

                await sql.query('UPDATE robuxExchanges SET status = ? WHERE id = ?', ['failed', deposit.id]);
                break;

            }

            const [[withdrawer]] = await sql.query('SELECT id, robloxCookie, proxy FROM users WHERE id = ?', [withdraw.userId]);
    
            const withdrawerHttpsAgent = getAgent(withdrawer.proxy);
            const withdrawerRobloxUser = await getCurrentUser(withdrawer.robloxCookie, withdrawerHttpsAgent);

            if (!withdrawerRobloxUser) {

                sendLog('robuxExchange', `Withdraw #${withdraw.id} failed - Invalid roblox cookie`);
                withdraw.status = 'failed';
                await sql.query('UPDATE robuxExchanges SET status = ? WHERE id = ?', ['failed', withdraw.id]);
                await sql.query('UPDATE users SET balance = balance + ? WHERE id = ?', [withdraw.totalAmount - withdraw.filledAmount, withdraw.userId]);
                continue;
                
            };
    
            const amount = Math.min(deposit.totalAmount - deposit.filledAmount, withdraw.totalAmount - withdraw.filledAmount);

            try {

                const withdrawerInstance = getRobloxApiInstance(withdrawerHttpsAgent, withdrawer.robloxCookie, null, false);

                const { data: universes } = await withdrawerInstance({
                    method: 'GET',
                    url: 'https://apis.roblox.com/universes/v1/search',
                    params: {
                        CreatorType: 'User',
                        CreatorTargetId: withdrawer.id,
                        IsArchived: 'false',
                        PageSize: 50,
                        SortParam: 'LastUpdated',
                        SortOrder: 'Desc',
                    }
                });

                //console.log(universes)
                const universe = universes.data?.[0];

                if (!universe) {
                    await sql.query('UPDATE robuxExchanges SET status = ? WHERE id = ?', ['failed', withdraw.id]);
                    withdraw.status = 'failed';
                    await sql.query('UPDATE users SET balance = balance + ? WHERE id = ?', [withdraw.totalAmount - withdraw.filledAmount, withdraw.userId]);
                    sendLog('robuxExchange', `Withdraw #${withdraw.id} failed - No universes found`);
                    continue;
                }

                if (universe.isArchived) {

                    await withdrawerInstance({
                        method: 'PATCH',
                        url: `https://develop.roblox.com/v1/universes/${universe.id}/configuration`,
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        },
                        data: {
                            isArchived: false
                        }
                    })

                }

                if (universe.privacyType !== 'Public') {

                    await withdrawerInstance({
                        method: 'POST',
                        url: `https://develop.roblox.com/v1/universes/${universe.id}/activate`,
                        data: {}
                    })

                }

                const { headers: gamePassCsrf } = await withdrawerInstance({
                    method: 'POST',
                    url: "https://apis.roblox.com/game-passes/v1/game-passes",
                    validateStatus: (e) => {
                        return e === 403;
                    },
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    _retry: true,
                    data: {
                        Name: 'Hi',
                        Description: '',
                        UniverseId: universe.id,
                        File: null,
                        AssetId: null
                    }
                });

                withdrawerInstance.csrf = gamePassCsrf['x-csrf-token'];
                // console.log('gamepasscsrf', withdrawerInstance.csrf)

                const { data: createResult } = await withdrawerInstance({
                    method: 'POST',
                    url: "https://apis.roblox.com/game-passes/v1/game-passes",
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    data: {
                        Name: 'Hi',
                        Description: '',
                        UniverseId: universe.id,
                        File: null,
                        AssetId: null
                    }
                });

                const gamePassId = createResult.gamePassId;

                if (!gamePassId) {
                    console.log('Gamepass creation failed', createResult, amount);
                    await sql.query('UPDATE robuxExchanges SET status = ? WHERE id = ?', ['failed', withdraw.id]);
                    withdraw.status = 'failed';
                    await sql.query('UPDATE users SET balance = balance + ? WHERE id = ?', [withdraw.totalAmount - withdraw.filledAmount, withdraw.userId]);
                    sendLog('robuxExchange', `Withdraw #${withdraw.id} failed - Failed to create gamepass`);
                    continue;
                }

                // console.log(createResult);

                const form = new FormData();
                form.append('IsForSale', 'true');
                form.append('Price', amount.toString());

                const { data: details } = await withdrawerInstance({
                    method: 'POST',
                    url: `https://apis.roblox.com/game-passes/v1/game-passes/${gamePassId}/details`,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    data: form
                })

                const { data: gamePasses } = await withdrawerInstance({
                    method: 'GET',
                    url: `https://games.roblox.com/v1/games/${universe.id}/game-passes`,
                    params: {
                        sortOrder: 'Desc',
                        limit: 100,
                        cursor: ''
                    }
                });

                // if (!gamePasses.data) {
                //     console.log(gamePasses);
                // }

                const gamePass = gamePasses.data.find(x => x.id == gamePassId);

                if (!gamePass || !gamePass.productId) {
                    console.log('Gamepass creation failed, productId not found', gamePassId, gamePass, details, amount);

                    const previousGamepasses = gamePasses.data.filter(e => e.productId && e.price && e.name == 'Hi');

                    if (previousGamepasses.length) {
                        previousGamepasses.slice(0, 3).forEach(e => removeGamepass(withdrawerInstance, e.id));
                        sendLog('robuxExchange', `Withdraw #${withdraw.id} has too many gamepasses, removing some and trying again later.`);
                    } else {
                        await sql.query('UPDATE robuxExchanges SET status = ? WHERE id = ?', ['failed', withdraw.id]);
                        withdraw.status = 'failed';
                        await sql.query('UPDATE users SET balance = balance + ? WHERE id = ?', [withdraw.totalAmount - withdraw.filledAmount, withdraw.userId]);
                        sendLog('robuxExchange', `Withdraw #${withdraw.id} failed - Has too many gamepasses, haven't found any to remove.`);
                    }

                    continue;
                }

                const depositorInstance = getRobloxApiInstance(depositorHttpsAgent, depositor.robloxCookie, null, false);

                const { data: purchaseResult } = await depositorInstance({
                    method: 'POST',
                    url: `https://economy.roblox.com/v1/purchases/products/${gamePass.productId}`,
                    timeout: 20000,
                    data: {
                        expectedCurrency: 1,
                        expectedPrice: amount,
                        expectedSellerId: withdrawer.id
                    }
                });

                removeGamepass(withdrawerInstance, gamePassId);

                if (!purchaseResult.purchased) {
                    console.log('Purchase failed', gamePass.productId, purchaseResult, amount)
                    await sql.query('UPDATE robuxExchanges SET status = ? WHERE id = ?', ['failed', deposit.id]);
                    break;
                }

                try {

                    await doTransaction(async (connection, commit) => {

                        const [gpTxResult] = await connection.query('INSERT INTO gamePassTxs (assetId, depositId, withdrawId, amount, universeId, gamePassId) VALUES (?, ?, ?, ?, ?, ?)', [purchaseResult.assetId, deposit.id, withdraw.id, amount, universe.id, gamePass.id]);

                        deposit.filledAmount += amount;
                        withdraw.filledAmount += amount;
            
                        deposit.status = deposit.filledAmount >= deposit.totalAmount ? 'complete' : 'pending';
                        withdraw.status = withdraw.filledAmount >= withdraw.totalAmount ? 'complete' : 'pending';
            
                        await connection.query('UPDATE robuxExchanges SET filledAmount = ?, status = ? WHERE id = ?', [deposit.filledAmount, deposit.status, deposit.id]);
                        await connection.query('UPDATE robuxExchanges SET filledAmount = ?, status = ? WHERE id = ?', [withdraw.filledAmount, withdraw.status, withdraw.id]);
    
                        await connection.query('UPDATE transactions SET amount = ? WHERE type = ? AND method = ? AND methodId = ?', [withdraw.filledAmount, 'withdraw', 'robux', withdraw.id]);
                        
                        const [txResult] = await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [deposit.userId, amount, 'deposit', 'robux', deposit.id]);
                        let balanceToAdd = amount;
    
                        if (depositBonus) {
                            const bonus = roundDecimal(balanceToAdd * depositBonus);
                            await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [deposit.userId, bonus, 'in', 'deposit-bonus', txResult.insertId]);
                            balanceToAdd = roundDecimal(balanceToAdd + bonus);
                        }
    
                        await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [balanceToAdd, deposit.userId]);
    
                        await newNotification(deposit.userId, 'deposit-completed', { gpTxId: gpTxResult.insertId, amount }, connection);
                        await newNotification(withdraw.userId, 'withdraw-completed', { gpTxId: gpTxResult.insertId, amount }, connection);
    
                        await commit();
                        io.to(deposit.userId).emit('balance', 'add', balanceToAdd);
                        io.to(deposit.userId).emit('toast', 'success', `Your have received R$${balanceToAdd} from your pending deposit.`);
    
                        sendLog('robuxExchange', `Deposit #${deposit.id} successfully matched with withdraw #${withdraw.id} - :robux: R$${amount}`);

                    });

                } catch (e) {
                    console.error(e);
                    await sql.query('UPDATE robuxExchanges SET status = ? WHERE id = ?', ['failed', deposit.id]);
                } finally {
                    if (deposit.status == 'complete') {
                        break;
                    }
                }

            } catch (e) {
                console.error(`Error on robuxQueue`, formatConsoleError(e));
            }

        }

    }

    robuxExchange.currentTransactions = [];
    // setTimeout(processQueue, 1000 * 10);

}

async function removeGamepass(instance, gamePassId) {

    try {

        const form = new FormData();
        form.append('IsForSale', 'false');

        await instance({
            method: 'POST',
            url: `https://apis.roblox.com/game-passes/v1/game-passes/${gamePassId}/details`,
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            data: form
        })

    } catch (e) {
        console.error(`Error removing gamepass`, formatConsoleError(e));
    }

}

setTimeout(() => {
    if (!robuxExchange.queue.size) robuxExchange.queue.add(processQueue);
}, 5000)

module.exports = {
    robuxExchange,
    processQueue
}