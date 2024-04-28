const express = require('express');
const router = express.Router();

const { newBets } = require('../../../socketio/bets');
const { isAuthed, apiLimiter } = require('../../auth/functions');
const { enabledFeatures, xpMultiplier } = require('../../admin/config');
const io = require('../../../socketio/server');

const { sql, doTransaction } = require('../../../database');
const { roundDecimal, xpChanged } = require('../../../utils');

const houseEdge = 0.5 / 100;

router.use(isAuthed);

router.get('/', async (req, res) => {

    const [[activeGame]] = await sql.query('SELECT actions, amount FROM blackjack WHERE endedAt IS NULL AND userId = ?', [req.userId]);
    if (!activeGame) return res.json({ activeGame: false });


});

router.use([(req, res, next) => {
    if (!enabledFeatures.blackjack) return res.status(400).json({ error: 'DISABLED' });
    next();
}, apiLimiter]);

router.post('/', async (req, res) => {

    const amount = roundDecimal(req.body.amount);
    if (amount < 1) return res.status(400).json({ error: 'BLACKJACK_MIN_BET' });
    if (amount > 25000) return res.status(400).json({ error: 'BLACKJACK_MAX_BET' });

    try {

        await doTransaction(async (connection, commit) => {

            const [[activeGame]] = await connection.query('SELECT id FROM blackjack WHERE userId = ? AND endedAt IS NULL FOR UPDATE', [req.userId]);
            if (activeGame) return res.status(400).json({ error: 'BLACKJACK_GAME_ACTIVE' });
    
            const [[user]] = await connection.query(`
                SELECT u.id, u.balance, u.xp, ss.seed as serverSeed, ss.id as ssId, ss.nonce, cs.seed as clientSeed, cs.id as csId FROM users u
                INNER JOIN serverSeeds ss ON u.id = ss.userId AND ss.endedAt IS NULL
                INNER JOIN clientSeeds cs ON u.id = cs.userId AND cs.endedAt IS NULL
                WHERE u.id = ? FOR UPDATE
            `,[req.userId]);
    
            if (!user) return res.status(404).json({ error: 'UNKNOWN_ERROR' });
            if (amount > user.balance) return res.status(400).json({ error: 'INSUFFICIENT_BALANCE' });
    
            const nonce = user.nonce + 1;
    
            const [nonceIncrease] = await connection.query('UPDATE serverSeeds SET nonce = nonce + 1 WHERE id = ?', [user.ssId]);
            if (nonceIncrease.affectedRows != 1) return res.status(404).json({ error: 'UNKNOWN_ERROR' });
    
            const xp = roundDecimal(amount * xpMultiplier);
            await connection.query('UPDATE users SET balance = balance - ?, xp = xp + ? WHERE id = ?', [amount, xp, req.userId]);
    
            const hands = getHands(user.serverSeed, user.clientSeed, nonce, []);
            const playerValue = getValueFromHand(hands.playerHands[0]);
            const dealerValue = getValueFromHand(hands.dealerHand);
    
            let game = {
                id: false,
                playerHands: hands.playerHands,
                playerValue,
                actions: [],
                dealerHand: hands.dealerHand,
                dealerValue,
                amount,
                endedAt: false,
                payout: 0
            };
    
            if (playerValue == 21) {
                // natural blackjack
    
                const payout = roundDecimal(amount * 2.5);
    
                const [result] = await connection.query(
                    'INSERT INTO blackjack (userId, amount, clientSeedId, serverSeedId, nonce, payout, endedAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    [req.userId, amount, user.csId, user.ssId, nonce, payout]
                );
    
                await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [payout, req.userId]);
    
                game.id = result.insertId;
                game.endedAt = new Date();
                game.payout = payout;
    
            } else {
                
                const [result] = await connection.query(
                    'INSERT INTO blackjack (userId, amount, clientSeedId, serverSeedId, nonce) VALUES (?, ?, ?, ?, ?)',
                    [req.userId, amount, user.csId, user.ssId, nonce]
                );
    
                game.id = result.insertId;
            
            }
    
            const edge = roundDecimal(amount * houseEdge);
            await connection.query('INSERT INTO bets (userId, amount, winnings, edge, game, gameId, completed) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.userId, amount, game.payout, edge, 'blackjack', game.id, game.endedAt ? 1 : 0]);
            await xpChanged(user.id, user.xp, roundDecimal(user.xp + xp), connection);
    
            await commit();                
            io.to(req.userId).emit('balance', 'set', roundDecimal(user.balance - amount + game.payout));

            if (game.endedAt) {
                newBets([{
                    user,
                    amount,
                    edge,
                    payout,
                    game: 'blackjack'
                }]);
            }

            return res.json({ success: true, data: game });

        })

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

});

function getHands(clientSeed, serverSeed, nonce, actions) {

    const playerHands = [[]];
    const dealerHand = [];

    let currentHand = 0;
    let cardIndex = 0;

    playerHands[currentHand].push(getBlackjackCard(serverSeed, clientSeed, nonce, cardIndex++));
    dealerHand.push(getBlackjackCard(serverSeed, clientSeed, nonce, cardIndex++));
    playerHands[currentHand].push(getBlackjackCard(serverSeed, clientSeed, nonce, cardIndex++));

    // const hiddenCard = getBlackjackCard(serverSeed, clientSeed, nonce, cardIndex++);
    cardIndex++ // hidden card

    for (let i = 0; i < actions.length; i += 1) {
        const action = actions[i];
        if (action == 'split') {
            const card = playerHands[currentHand].pop();
            playerHands[currentHand].push(getBlackjackCard(serverSeed, clientSeed, nonce, cardIndex++));
            playerHands.push([card]);
            playerHands[currentHand + 1].push(getBlackjackCard(serverSeed, clientSeed, nonce, cardIndex++));
        } else if (action == 'double') {
            playerHands[currentHand].push(getBlackjackCard(serverSeed, clientSeed, nonce, cardIndex++));
            if (playerHands.length > currentHand + 1) {
                currentHand += 1;
            }
        } else if (action == 'hit') {
            playerHands[currentHand].push(getBlackjackCard(serverSeed, clientSeed, nonce, cardIndex++));
            if (playerHands.length > currentHand + 1 && getValueFromHand(playerHands[currentHand]) >= 21) {
                currentHand += 1;
            }
        } else if (action == 'stand') {
            if (playerHands.length > currentHand + 1) {
                currentHand += 1;
            }
        }
    }

    return {
        playerHands,
        dealerHand,
        currentHand,
        cardIndex
    };

}

function getValueFromHand(hand) {
    
    let value = 0;
    let aces = 0;

    for (let i = 0; i < hand.length; i += 1) {
        const face = hand[i].face;
        if (face === 'A') {
            aces += 1;
            value += 11;
        } else if (['J', 'Q', 'K'].includes(face)) {
            value += 10;
        } else {
            value += Number.parseInt(face);
        }
    }

    while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }

    return value;
    
}

router.post('/hit', async (req, res) => {

    await doTransaction(async (connection, commit) => {

        const [[activeGame]] = await connection.query(`
            SELECT actions, amount, b.nonce, ss.seed as serverSeed, cs.seed as clientSeed FROM blackjack
            INNER JOIN clientSeeds cs ON b.clientSeedId = cs.id
            INNER JOIN serverSeeds ss ON b.serverSeedId = ss.id
            WHERE b.endedAt IS NULL AND b.userId = ?
            `, [req.userId]
        );

        if (!activeGame) return res.status(400).json({ error: 'NO_BLACKJACK_GAME_ACTIVE' });

        const actions = JSON.parse(activeGame.actions);
        const hands = getHands(activeGame.clientSeed, activeGame.serverSeed, activeGame.nonce, actions);
        hands.playerHands[hands.currentHand].push(getBlackjackCard(activeGame.serverSeed, activeGame.clientSeed, activeGame.nonce, hands.cardIndex++));
        actions.push('hit');

        if (hands.currentHand + 1 >= hands.playerHands.length) {

            let bust = true;

            for (let i = 0; i < hands.playerHands.length; i += 1) {
                let hand = hands.playerHands[i];
                hand.value = getValueFromHand(hand);
                if (hand.value <= 21) {
                    bust = false;
                    break;
                }
            }
            

            let payout = 0;

            if (bust) {

            } else if (!bust && hands.playerHands[hands.currentHand].value == 21) {

                hands.dealerHand.push(getBlackjackCard(activeGame.serverSeed, activeGame.clientSeed, activeGame.nonce, 3));
                let dealerValue = getValueFromHand(hands.dealerHand);

                while (dealerValue < 17) {
                    hands.dealerHand.push(getBlackjackCard(activeGame.serverSeed, activeGame.clientSeed, activeGame.nonce, hands.cardIndex++));
                    dealerValue = getValueFromHand(hands.dealerHand);
                }

                if (dealerValue > 21) {
                    // dealer bust

                    for (let i = 0; i < hands.playerHands.length; i += 1) {
                            
                        const hand = hands.playerHands[i];
                        if (hand.value > 21) continue;

                        // player wins
                        payout += roundDecimal(activeGame.amount * 2);

                    }

                } else {

                    for (let i = 0; i < hands.playerHands.length; i += 1) {
                        
                        const hand = hands.playerHands[i];
                        if (hand.value > 21) continue;

                        if (playerValue > dealerValue) {
                            // player wins
                            payout += roundDecimal(activeGame.amount * 2);
                        } else if (playerValue < dealerValue) {
                            // player loses
                        } else {
                            // push
                            payout += activeGame.amount;
                        }

                    }

                }
            } else {
                // and the game goes on
            }

        }

    });

});

router.post('/stand', async (req, res) => {



});

router.post('/double', async (req, res) => {



});

router.post('/split', async (req, res) => {



});

router.post('/insurance', async (req, res) => {



});

module.exports = router;