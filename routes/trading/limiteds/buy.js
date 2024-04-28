const express = require('express');
const router = express.Router();

const { sql, doTransaction } = require('../../../database');

const axios = require('axios');
const { isAuthed, apiLimiter } = require('../../auth/functions');
const { roundDecimal, formatConsoleError, getRobloxApiInstance, sendLog, newNotification } = require('../../../utils');
const { getCurrentUser, getInventory, cachedInventories } = require('../../../utils/roblox');
const { getAgent } = require('../../../utils/proxies');
const io = require('../../../socketio/server');
const { enabledFeatures, checkAccountLock, depositBonus } = require('../../admin/config');
const { marketplaceListings, checkTradeSettings, buy2FAs: pending2fas, adurite } = require('./functions');
const { cryptoData } = require('../crypto/deposit/functions');

const buying = {};

router.use((req, res, next) => {
    if (!enabledFeatures.limitedWithdrawals) return res.status(400).json({ error: 'DISABLED' });
    next();
});

router.post('/', isAuthed, apiLimiter, async (req, res) => {

    const listingId = req.body.listingId;
    if (!listingId) return res.status(400).json({ error: 'MISSING_LISTING_ID' });

    if (buying[listingId]) {
        return res.json({ error: 'LISTING_BUSY' });
    }

    buying[listingId] = req.userId;

    try {
        const result = await handleBuy(req.userId, listingId);
        res.json(result);
    } catch (e) {
        console.error(formatConsoleError(e));
        res.status(400).json({ error: 'UNKNOWN_ERROR' });
    }

    delete buying[listingId];

});

async function handleAduriteBuy(user, cachedListing, dummyItem) {

    let cachedPrice = cachedListing.price;
    let withdrawalId = false;
    let txId = false;

    try {

        await doTransaction(async (connection, commit) => {

            const [balResult] = await connection.query('UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?', [cachedPrice, user.id, cachedPrice]);
            if (balResult.affectedRows != 1) return { error: 'INSUFFICIENT_BALANCE' };

            const [aduriteResult] = await connection.query('INSERT INTO adurite (aduriteId, userId, robuxAmount) VALUES (?, ?, ?)', [cachedListing.adurite, user.id, cachedPrice]);
            withdrawalId = aduriteResult.insertId;
            
            const [txResult] = await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [user.id, cachedPrice, 'out', 'adurite', aduriteResult.insertId]);
            txId = txResult.insertId;

            await commit();

        });

    } catch (e) {
        console.error(e);
        return { error: 'UNKNOWN_ERROR' };
    }

    async function failed(price, err) {

        try {
            await doTransaction(async (connection, commit) => {

                await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [price, user.id]);
                await connection.query('UPDATE adurite SET status = ? WHERE id = ?', ['failed', withdrawalId]);
                await connection.query('DELETE FROM transactions WHERE id = ?', [txId]);
    
                await commit();
    
            });
        } catch (e) {
            console.error(e);
            return { error: 'UNKNOWN_ERROR' };
        }
        
        return { error: err || 'UNKNOWN_ERROR' };

    }

    const reserveResponse = await adurite({
        url: '/reserve-item',
        method: "POST",
        timeout: 30000,
        data: {
            "chosen_item_id": +cachedListing.adurite,
            "user_id": +user.id
        }
    });

    const reserveData = reserveResponse.data;

    if (!reserveData.ok) {
        console.log(`Failed to reserve adurite item`, reserveData, reserveResponse.status);
        return await failed(cachedPrice);
    }

    delete marketplaceListings[cachedListing.id];
    const price = Math.ceil(+reserveData.data.price / cryptoData.robuxRate.usd * cryptoData.robuxRate.robux);

    try {
        const suc = await doTransaction(async (connection, commit) => {

            await connection.query('UPDATE adurite SET robuxAmount = ?, fiatAmount = ?, status = ?, reservationId = ? WHERE id = ?', [price, +reserveData.data.price, 'reserved', reserveData.data.tracking_id, withdrawalId]);

            if (price != cachedPrice) {
                await connection.query('UPDATE transactions SET amount = ? WHERE id = ?', [price, txId]);
                
                const diff = price - cachedPrice;
                
                if (diff > 0) {
                    const [balRes] = await connection.query('UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?', [diff, user.id, diff]);
                    if (balRes.affectedRows != 1) return false;
                } else {
                    await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [Math.abs(diff), user.id]);
                }
            }

            await commit();
            return true;

        });

        if (!suc) {
            console.log(`Failed to update adurite price`);
            return await failed(cachedPrice);
        }
    } catch (e) {
        console.error(e);
        return await failed(cachedPrice);
    }

    let buyResp = false;

    try {
        buyResp = await adurite({
            url: '/purchase-item',
            method: "POST",
            timeout: 30000,
            data: {
                "tracking_id": reserveData.data.tracking_id,
                "user_id": +user.id,
                "small_item_uaid": dummyItem.userAssetId
            }
        });
    } catch (e) {
        console.error(`Failed to buy adurite item err`, e);
        return await failed(price);
    }

    buyData = buyResp.data;

    if (!buyData.ok) {
        console.log(`Failed to buy adurite item`, buyData, buyResp.status);
        return await failed(price, buyData.exception_code == 'INSUFFICIENT_BALANCE' && 'LISTING_UNAVAILABLE');
    }

    // console.log(buyData);

    try {

        await doTransaction(async (connection, commit) => {

            await connection.query('UPDATE adurite SET status = ? WHERE id = ?', ['completed', withdrawalId]);
            await connection.query('UPDATE transactions SET type = ? WHERE id = ?', ['withdraw', txId]);
            await newNotification(user.id, 'withdraw-completed', { amount: price, txId }, connection);

            await commit();

        });

    } catch (e) {
        console.error(e);
        return { error: 'UNKNOWN_ERROR' };
    }

    sendLog('market', `*${user.username}* (\`${user.id}\`) bought Adurite listing \`${cachedListing.adurite}\` (\`${withdrawalId}\`) for :robux: R$${price} ($${reserveData.data.price}usd).`);
    return { success: true };

}

async function handleBuy(userId, listingId) {

    const cachedListing = marketplaceListings[listingId] || adurite.listings[listingId];
    if (!cachedListing) return { error: 'LISTING_REMOVED' };

    let listing = false;
    let items = false;

    if (!cachedListing.adurite) {
        [[listing]] = await sql.query('SELECT id, sellerId FROM marketplaceListings WHERE id = ? AND buyerId IS NULL AND status = ?', [listingId, 'active']);
        if (!listing) return { error: 'LISTING_REMOVED' };

        if (listing.sellerId == userId) return { error: 'CANNOT_BUY_OWN_LISTING' };
        [items] = await sql.query('SELECT * FROM marketplaceListingItems WHERE marketplaceListingId = ?', [listing.id]);
    } else {
        if (adurite.balance < cachedListing.usd) return { error: 'LISTING_UNAVAILABLE' };
        listing = {};
    }

    const [[buyer]] = await sql.query('SELECT id, username, robloxCookie, proxy, accountLock, sponsorLock, balance, xp, verified, perms FROM users WHERE id = ?', [userId]);

    if (buyer.perms < 1) {
        if (buyer.xp < 5000) return { error: 'INSUFFICIENT_XP' };

        const [[lastWeekDeposits]] = await sql.query('SELECT COALESCE(SUM(amount), 0) as sum FROM transactions WHERE userId = ? AND type = ? AND createdAt > ?', [userId, 'deposit', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)]);
        if (lastWeekDeposits.sum < 200) return { error: 'INSUFFICIENT_DEPOSITS' };

        const [[totalDeposits]] = await sql.query('SELECT COALESCE(SUM(amount), 0) as sum FROM transactions WHERE userId = ? AND type = ?', [userId, 'deposit']);
        const [[userWagered]] = await sql.query('SELECT COALESCE(SUM(amount), 0) AS sum FROM bets WHERE userId = ? AND completed = 1', [userId]);
        if (totalDeposits.sum > userWagered.sum) return { error: 'NOT_ENOUGH_WAGERED_WITHDRAW' };

        const [[lastDeposit]] = await sql.query('SELECT amount, createdAt FROM transactions WHERE userId = ? AND type = ? ORDER BY id DESC LIMIT 1', [userId, 'deposit']);
        const [[wageredSinceLastDeposit]] = await sql.query('SELECT COALESCE(SUM(amount), 0) AS sum FROM bets WHERE userId = ? AND completed = 1 AND createdAt > ?', [userId, lastDeposit.createdAt]);
        if (lastDeposit.amount > wageredSinceLastDeposit.sum) return { error: 'NOT_ENOUGH_WAGERED_WITHDRAW' };

    }

    buyer.accountLock = await checkAccountLock(buyer);
    if (buyer.accountLock || buyer.sponsorLock) return { error: 'ACCOUNT_LOCKED' };

    listing.total = cachedListing.price;

    if (listing.total > buyer.balance) return { error: 'INSUFFICIENT_BALANCE' };

    const buyerAgent = getAgent(buyer.proxy);
    const buyerRobloxUser = await getCurrentUser(buyer.robloxCookie, buyerAgent);
    if (!buyerRobloxUser) return { error: 'INVALID_ROBLOX_COOKIE' }
    if (!buyerRobloxUser.IsPremium) return { error: 'NOT_PREMIUM' }

    const buyerInstance = getRobloxApiInstance(buyerAgent, buyer.robloxCookie, null, false);

    const { data: authenticatorData } = await buyerInstance({
        url: `https://twostepverification.roblox.com/v1/users/${buyer.id}/configuration`
    })

    const isAuthenticatorEnabled = authenticatorData.methods.find(m => m.mediaType == 'Authenticator')?.enabled;
    if (!isAuthenticatorEnabled) return { error: 'AUTHENTICATOR_NOT_ENABLED' };

    delete cachedInventories[buyer.id];

    const buyerSettingsError = await checkTradeSettings(buyerInstance);
    if (buyerSettingsError) return { error: buyerSettingsError };

    const inventory = await getInventory(buyer.id);
    const dummyItem = inventory.filter(i => i.price < Math.min(200, listing.total) && !i.isOnHold).sort((a, b) => a.price - b.price)[0];

    if (!dummyItem) return { error: 'MISSING_DUMMY_ITEM' };

    if (cachedListing.adurite) {
        return await handleAduriteBuy(buyer, cachedListing, dummyItem);
    }

    const [[seller]] = await sql.query('SELECT id, username, robloxCookie, proxy FROM users WHERE id = ?', [listing.sellerId]);
    if (!seller) return { error: 'SELLER_NOT_FOUND' };

    const sellerAgent = getAgent(seller.proxy);
    const sellerRobloxUser = await getCurrentUser(seller.robloxCookie, sellerAgent);

    if (!sellerRobloxUser) {
        return await cancelListingsFromUser(seller, 'roblox cookie is invalid');
    } else if (!sellerRobloxUser.IsPremium) {
        return await cancelListingsFromUser(seller, 'isn\'t premium anymore');
    }

    const sellerInstance = getRobloxApiInstance(sellerAgent, seller.robloxCookie, null, false);
    const sellerSettingsError = await checkTradeSettings(sellerInstance);
    if (sellerSettingsError) {
        return await cancelListingsFromUser(seller, `settings error: \`${sellerSettingsError}\``);
    }

    delete cachedInventories[seller.id];
    const sellerInventory = await getInventory(seller.id);

    if (items.some(i => !sellerInventory.some(s => s.userAssetId == i.userAssetId))) {
        delete marketplaceListings[listing.id];
        await sql.query('UPDATE marketplaceListings SET status = ? WHERE id = ?', ['failed', listing.id]);
        sendLog('market', `Listing \`${listing.id}\` cancelled because *${seller.username}* (\`${seller.id}\`) inventory has changed.`);
        return { error: 'LISTING_REMOVED' };
    }

    return await buyListing({ listing, buyerInstance, buyer, seller, sellerInstance, dummyItem, items });

}

async function cancelListingsFromUser(seller, reason) {

    const listingIds = [];

    Object.values(marketplaceListings).forEach(l => {
        if (l.sellerId != seller.id) return;
        listingIds.push(l.id);
        delete marketplaceListings[l.id];
    });

    await sql.query('UPDATE marketplaceListings SET status = ? WHERE id IN (?)', ['failed', listingIds]);

    sendLog('market', `Listing(s) ${listingIds.map(e => `\`${e}\``).join(', ')} were cancelled. Reason: *${seller.username}* (\`${seller.id}\`) ${reason}.`);
    return { error: 'LISTING_REMOVED' };

}

async function buyListing(data) {
    
    const { listing, buyerInstance, buyer, seller, sellerInstance, dummyItem, items, metadata, challengeId } = data;

    let headers = {};
    if (challengeId) {
        headers = {
            'Rblx-Challenge-Id': challengeId,
            'Rblx-Challenge-Metadata': metadata,
            'Rblx-Challenge-Type': 'twostepverification'
        }
    }

    const tradeResp = await buyerInstance({
        method: 'POST',
        url: 'https://trades.roblox.com/v1/trades/send',
        headers,
        data: {
            offers: [{
                robux: null,
                userAssetIds: [dummyItem.userAssetId],
                userId: buyer.id
            }, {
                robux: null,
                userAssetIds: items.map(i => i.userAssetId),
                userId: seller.id
            }]
        }
    });

    if (tradeResp.status != 200) {

        const error = tradeResp.data.errors?.[0];

        if (!error) {
            console.log(`Unknown trade error`, tradeResp.data);
            return { error: 'UNKNOWN_ERROR' };
        }

        if (error.code == 0) {

            const neededChallenge = tradeResp.headers['rblx-challenge-type'];

            if (!neededChallenge) {
                console.log(`Unknown error trade send`, tradeResp.data);
                return { error: 'UNKNOWN_ERROR' };
            }

            if (neededChallenge != 'twostepverification') {
                console.log(`Unknown challenge type`, neededChallenge);
                return { error: 'UNKNOWN_ERROR' };
            }

            const metadata = JSON.parse(Buffer.from(tradeResp.headers['rblx-challenge-metadata'], 'base64').toString('ascii'));

            pending2fas[buyer.id] = {
                challengeId: tradeResp.headers['rblx-challenge-id'],
                metadataChallengeId: metadata.challengeId,
                ...data,
                createdAt: Date.now()
            };

            return { success: true, step: '2fa', challengeId: tradeResp.headers['rblx-challenge-id'] };

        } else if (error.code == 22) {
            
            console.log(`Unknown trade error, privacy?`, tradeResp.data);
            return { error: 'UNKNOWN_ERROR' };

        } else if (error.code == 16) {

            // trade ratio triggered
            delete marketplaceListings[listing.id];
            await sql.query('UPDATE marketplaceListings SET status = ? WHERE id = ?', ['failed', listing.id]);
            sendLog('market', `Listing \`${listing.id}\` cancelled because trade triggers ratio check.`);
            return { error: 'LISTING_REMOVED' };

        } else {
            console.log(`Trade failed while sending`, tradeResp.data);
            return { error: 'UNKNOWN_ERROR' };
        }

    }

    const robloxTradeId = tradeResp.data.id;

    if (!robloxTradeId) {
        console.log(`Sent trade id missing`, tradeResp.data);
        return { error: 'UNKNOWN_ERROR' };
    }

    const [result] = await sql.query('UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?', [listing.total, buyer.id, listing.total]);

    if (result.affectedRows != 1) {
        buyerInstance({
            method: 'POST',
            url: 'https://trades.roblox.com/v1/trades/' + robloxTradeId + '/decline'
        })
        return { error: 'INSUFFICIENT_BALANCE' };
    }

    const tradeAccepted = await acceptTrade(robloxTradeId, seller, sellerInstance, listing, null, null);

    if (tradeAccepted != true) {
        buyerInstance({
            method: 'POST',
            url: 'https://trades.roblox.com/v1/trades/' + robloxTradeId + '/decline'
        });
        await sql.query('UPDATE users SET balance = balance + ? WHERE id = ?', [listing.total, buyer.id]);
        return tradeAccepted;
    }

    try {

        await doTransaction(async (connection, commit) => {
        
            const [withdrawTxResult] = await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [buyer.id, listing.total, 'withdraw', 'limiteds', listing.id]);
            const [depositTxResult] = await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [seller.id, listing.total, 'deposit', 'limiteds', listing.id]);
    
            let balanceToAdd = listing.total;
    
            if (depositBonus) {
                const bonus = roundDecimal(balanceToAdd * depositBonus);
                await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [seller.id, bonus, 'in', 'deposit-bonus', depositTxResult.insertId]);
                balanceToAdd = roundDecimal(balanceToAdd + bonus);
            }
    
            await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [balanceToAdd, seller.id]);
                
            await newNotification(buyer.id, 'withdraw-completed', { amount: listing.total, txId: withdrawTxResult.insertId }, connection);
            await newNotification(seller.id, 'deposit-completed', { amount: listing.total, txId: depositTxResult.insertId }, connection);
    
            await connection.query('UPDATE marketplaceListings SET buyerId = ?, robloxTradeId = ?, status = ?, boughtPrice = ?, buyerItem = ? WHERE id = ?', [
                buyer.id,
                robloxTradeId,
                'completed',
                listing.total,
                JSON.stringify({
                    userAssetId: dummyItem.userAssetId,
                    assetId: dummyItem.assetId,
                    price: dummyItem.price
                }),
                listing.id
            ]);
                
            await commit();

            io.to(seller.id).emit('balance', 'add', balanceToAdd);
            io.to(seller.id).emit('toast', 'success', 'You have successfully sold your item(s) on the marketplace.');
            io.to(buyer.id).emit('balance', 'set', roundDecimal(buyer.balance - listing.total));
    
            sendLog('market', `*${buyer.username}* (\`${buyer.id}\`) bought listing #${listing.id} from *${seller.username}* (\`${seller.id}\`) for :robux: R$${listing.total}`);
            delete marketplaceListings[listing.id];

            return { success: true };

        });

    } catch (e) {
        console.error(e);
        return { error: 'UNKNOWN_ERROR' };
    }
    
}

async function acceptTrade(robloxTradeId, seller, sellerInstance, listing, challengeId, metadata) {

    const headers = {};

    if (challengeId) {
        headers['Rblx-Challenge-Id'] = challengeId;
        headers['Rblx-Challenge-Metadata'] = metadata;
        headers['Rblx-Challenge-Type'] = 'twostepverification';
    }

    try {

        const acceptTradeResp = await sellerInstance({
            method: 'POST',
            headers,
            url: 'https://trades.roblox.com/v1/trades/' + robloxTradeId + '/accept'
        });
    
        if (acceptTradeResp.status != 200) {
    
            const error = acceptTradeResp.data.errors?.[0];
    
            if (!error) {
                console.log(`Unknown trade accept error`, acceptTradeResp.data);
                return { error: 'UNKNOWN_ERROR' };
            }
    
            if (error.code == 0) {
    
                const neededChallenge = acceptTradeResp.headers['rblx-challenge-type'];
    
                if (!neededChallenge) {
                    console.log(`Unknown error trade accept`, acceptTradeResp.data);
                    return { error: 'UNKNOWN_ERROR' };
                }
    
                if (neededChallenge != 'twostepverification') {
                    console.log(`Unknown challenge type accept trade`, neededChallenge);
                    return { error: 'UNKNOWN_ERROR' };
                }
            
                const incomingMetadata = JSON.parse(Buffer.from(acceptTradeResp.headers['rblx-challenge-metadata'], 'base64').toString('ascii'));
    
                const { data: verifyStartResp } = await sellerInstance({
                    method: 'POST',
                    url: `https://twostepverification.roblox.com/v1/users/${seller.id}/challenges/security-key/verify-start` ,
                    data: {
                        actionType: "Generic",
                        challengeId: incomingMetadata.challengeId
                    }
                });
    
                if (!verifyStartResp.authenticationOptions) {
                    console.log(`Unknown error verifyStartResp, seller probably removed key`, verifyStartResp);
                    return await cancelListingsFromUser(seller, 'removed security key');
                }
        
                const pkcro = JSON.parse(verifyStartResp.authenticationOptions);
                const userKeys = pkcro.publicKey.allowCredentials.map(e => e.id);
        
                const [[key]] = await sql.query('SELECT id, privateKey FROM securityKeys WHERE userId = ? AND id IN(?)', [seller.id, userKeys]);
        
                if (!key) {
                    console.log(`Seller removed key`, key);
                    return { error: 'UNKNOWN_ERROR' };
                }
    
                verifyStartResp.credentialId = key.id;
                verifyStartResp.privateKey = key.privateKey;
    
                const { data: solvedChallengeResp } = await axios({
                    method: 'POST',
                    url: process.env.AUTHN_URL + '/login',
                    data: verifyStartResp
                });
    
                if (!solvedChallengeResp?.code) {
                    console.log(`Unknown error solvedChallengeResp`, solvedChallengeResp);
                    return { error: 'UNKNOWN_ERROR' };
                }
    
                solvedChallengeResp.actionType = "Generic";
    
                const { data: verifyFinishResp } = await sellerInstance({
                    method: 'POST',
                    url: `https://twostepverification.roblox.com/v1/users/${seller.id}/challenges/security-key/verify-finish`,
                    data: solvedChallengeResp
                });
    
                if (!verifyFinishResp.verificationToken) {
                    console.log(`Unknown error verifyFinishResp`, verifyFinishResp);
                    return { error: 'UNKNOWN_ERROR' };
                }
    
                const metadataObj = JSON.stringify({
                    verificationToken: verifyFinishResp.verificationToken,
                    rememberDevice: true,
                    challengeId: incomingMetadata.challengeId,
                    actionType: "Generic"
                });
    
                await sellerInstance({
                    method: 'POST',
                    url: 'https://apis.roblox.com/challenge/v1/continue',
                    data: {
                        challengeId: acceptTradeResp.headers['rblx-challenge-id'],
                        challengeMetadata: metadataObj,
                        challengeType: 'twostepverification'
                    }
                });
    
                const metadata = Buffer.from(metadataObj).toString('base64');
                return acceptTrade(robloxTradeId, seller, sellerInstance, listing, acceptTradeResp.headers['rblx-challenge-id'], metadata);
    
            } else {
    
                console.log(`Accept trade unknown error`, acceptTradeResp.data);
                return { error: 'UNKNOWN_ERROR' };
    
            }
    
        }
    
        return true;

    } catch (e) {
        console.error(formatConsoleError(e));
        return { error: 'UNKNOWN_ERROR' };
    }

}

router.post('/2fa', isAuthed, apiLimiter, async (req, res) => {

    const pending2fa = pending2fas[req.userId];

    // console.log(pending2fa?.challengeId, req.body.challengeId);
    if (pending2fa?.challengeId != req.body.challengeId) return res.status(400).json({ error: 'EXPIRED_CHALLENGE' });

    const code = req.body.code;
    if (typeof code != 'string' || code.length != 6) return res.status(400).json({ error: 'INVALID_2FA' });

    const cachedListing = marketplaceListings[pending2fa.listing.id];
    if (!cachedListing) return { error: 'LISTING_REMOVED' };

    if (buying[pending2fa.listing.id]) {
        return res.json({ error: 'LISTING_BUSY' });
    }

    buying[pending2fa.listing.id] = req.userId;

    try {

        const { buyerInstance } = pending2fa;
        const { data: challengeResp } = await buyerInstance({
            method: 'POST',
            url: `https://twostepverification.roblox.com/v1/users/${req.userId}/challenges/authenticator/verify`,
            data: {
                actionType: "Generic",
                challengeId: pending2fa.metadataChallengeId,
                code
            }
        });
    
        const verificationToken = challengeResp.verificationToken;
    
        if (!verificationToken) {
    
            const error = challengeResp.errors?.[0]?.code;
            if (!Number.isInteger(error)) {
                console.log(`Unknown resp buy authenticator verify`, challengeResp);
                return res.status(400).json({ error: 'UNKNOWN_ERROR' });
            }
    
            if (error == 10) {
                return res.status(400).json({ error: 'INVALID_2FA' });
            } else {
                console.log(`Unknown error buy authenticator verify`, challengeResp);
                return res.status(400).json({ error: 'UNKNOWN_ERROR' });
            }
    
        } else {
    
            const metadataObj = JSON.stringify({
                verificationToken,
                rememberDevice: true,
                challengeId: pending2fa.metadataChallengeId,
                actionType: "Generic"
            });
    
            await buyerInstance({
                method: 'POST',
                url: 'https://apis.roblox.com/challenge/v1/continue',
                data: {
                    challengeId: pending2fa.challengeId,
                    challengeMetadata: metadataObj,
                    challengeType: 'twostepverification'
                }
            })

            const metadata = Buffer.from(metadataObj).toString('base64');
    
            delete pending2fas[req.userId];
            const data = await buyListing({ ...pending2fa, metadata });
            return res.json(data);
    
        }

    } catch (e) {
        console.error(formatConsoleError(e));
        return res.status(400).json({ error: 'UNKNOWN_ERROR' });
    } finally {
        delete buying[pending2fa.listing.id];
    }

});

module.exports = router;