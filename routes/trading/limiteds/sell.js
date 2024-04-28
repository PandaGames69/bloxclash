const express = require('express');
const router = express.Router();

const { sql, doTransaction } = require('../../../database');
const crypto = require('crypto');
const axios = require('axios');

const { isAuthed, apiLimiter } = require('../../auth/functions');
const { roundDecimal, getRobloxApiInstance, sendLog } = require('../../../utils');
const { getCurrentUser, getInventory } = require('../../../utils/roblox');
const { items } = require('../../../utils/roblox/items');
const { getAgent } = require('../../../utils/proxies');
const { enabledFeatures } = require('../../admin/config');
const { marketplaceListings, checkTradeSettings, sell2FAs: pending2fas } = require('./functions');

const minListingPrice = 300;

router.use((req, res, next) => {
    if (!enabledFeatures.limitedDeposits) return res.status(400).json({ error: 'DISABLED' });
    next();
});

router.post('/', isAuthed, apiLimiter, async (req, res) => {

    const listingItems = req.body.items;
    if (!listingItems || !Array.isArray(listingItems) || !listingItems.length) return res.status(400).json({ error: 'MISSING_ITEMS' });
    if (listingItems.length > 4) return res.status(400).json({ error: 'TOO_MANY_ITEMS' });

    if (typeof req.body.total != 'number' || req.body.total < minListingPrice) return res.status(400).json({ error: 'MIN_LISTING_PRICE' });

    const invalid = listingItems.some((i) => {
        if (typeof i.discount != 'number') return true;
        i.discount = roundDecimal(i.discount);
        return !i.userAssetId || i.discount > 50 || i.discount < -50
    });

    if (invalid) return res.status(400).json({ error: 'INVALID_ITEMS' });

    delete pending2fas[req.userId];
    const [[user]] = await sql.query('SELECT id, username, robloxCookie, proxy FROM users WHERE id = ?', [req.userId]);

    const agent = getAgent(user.proxy);
    const robloxUser = await getCurrentUser(user.robloxCookie, agent);

    if (!robloxUser) return res.status(401).json({ error: 'INVALID_ROBLOX_COOKIE' });
    if (!robloxUser.IsPremium) return res.status(400).json({ error: 'NOT_PREMIUM' });

    const instance = getRobloxApiInstance(agent, user.robloxCookie, null, false);

    const settingsError = await checkTradeSettings(instance);
    if (settingsError) return res.status(400).json({ error: settingsError });

    const { data: securityKeys } = await instance({
        method: 'POST',
        url: `https://twostepverification.roblox.com/v1/users/${user.id}/configuration/security-key/list`,
        data: {}
    });

    // console.log(securityKeys)
    let hasKey = securityKeys.credentials.length;

    if (hasKey) {

        if (hasKey >= 5) return res.status(400).json({ error: 'SECURITY_KEYS_LIMIT' });

        const { data: challengeResp } = await instance({
            method: 'POST',
            url: `https://twostepverification.roblox.com/v1/users/${user.id}/challenges/security-key/verify-start`,
            data: {
                actionType: "Generic",
                challengeId: crypto.randomUUID()
            }
        });

        if (!challengeResp.authenticationOptions) {
            console.log(`Unknown error challengeResp`, challengeResp);
            return res.status(400).json({ error: 'UNKNOWN_ERROR' });
        }

        const pkcro = JSON.parse(challengeResp.authenticationOptions);
        const userKeys = pkcro.publicKey.allowCredentials.map(e => e.id);

        const [[key]] = await sql.query('SELECT id FROM securityKeys WHERE userId = ? AND id IN(?)', [user.id, userKeys]);

        if (!key) {
            hasKey = false;
        }

    }

    if (!hasKey) {

        const keyAdded = await addKey(user, instance, securityKeys, listingItems);
        if (keyAdded != true) return res.json(keyAdded);

    }

    listItems(req, res, user, listingItems);

});

router.post('/2fa', isAuthed, apiLimiter, async (req, res) => {

    const pending2fa = pending2fas[req.userId];
    if (pending2fa?.challengeId != req.body.challengeId) return res.status(400).json({ error: 'EXPIRED_CHALLENGE' });

    const code = req.body.code;
    if (typeof code != 'string' || code.length != 6) return res.status(400).json({ error: 'INVALID_2FA' });

    const { instance } = pending2fa;
    const { data: challengeResp } = await instance({
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
            console.log(`Unknown resp security key authenticator verify`, challengeResp);
            return res.status(400).json({ error: 'UNKNOWN_ERROR' });
        }

        if (error == 10) {
            return res.status(400).json({ error: 'INVALID_2FA' });
        } else if (error == 9) {
            return res.status(400).json({ error: 'AUTHENTICATOR_NOT_ENABLED' });
        } else {
            console.log(`Unknown error security key authenticator verify`, challengeResp);
            return res.status(400).json({ error: 'UNKNOWN_ERROR' });
        }

    } else {

        const metadataObj = JSON.stringify({
            verificationToken,
            rememberDevice: true,
            challengeId: pending2fa.metadataChallengeId,
            actionType: "Generic"
        });

        await instance({
            method: 'POST',
            url: 'https://apis.roblox.com/challenge/v1/continue',
            data: {
                challengeId: pending2fa.challengeId,
                challengeMetadata: metadataObj,
                challengeType: 'twostepverification'
            }
        })

        const metadata = Buffer.from(metadataObj).toString('base64');
        const keyAdded = await addKey(pending2fa.user, pending2fa.instance, pending2fa.securityKeys, pending2fa.listingItems, pending2fa.challengeId, metadata);
        if (keyAdded != true) return res.json(keyAdded);

        listItems(req, res, pending2fa.user, pending2fa.listingItems);

    }

});

async function addKey(user, instance, securityKeys, listingItems, challengeId, metadata) {

    const cfg = {
        method: 'POST',
        url: `https://twostepverification.roblox.com/v1/users/${user.id}/configuration/security-key/enable`
    };

    if (challengeId) {
        // console.log(metadata);
        cfg.headers = {
            'Rblx-Challenge-Id': challengeId,
            'Rblx-Challenge-Metadata': metadata,
            'Rblx-Challenge-Type': 'twostepverification'
        }
    }
    
    const enableKeyResp = await instance(cfg);

    if (enableKeyResp.data.creationOptions) {

        const { data: registerResp } = await axios({
            url: process.env.AUTHN_URL + '/register',
            method: 'POST',
            data: enableKeyResp.data
        });

        if (!registerResp.credentialId) {
            console.log(`Unknown error security key register`, registerResp);
            return { error: 'UNKNOWN_ERROR' };
        }

        const nicknames = ['BloxClash', 'BloxClash 2', 'BloxClash 3', 'BloxClash 4', 'BloxClash 5'];
        const nickname = nicknames.find(n => !securityKeys.credentials.some(c => c.nickname == n));

        await sql.query('INSERT INTO securityKeys (id, userId, nickname, privateKey) VALUES (?, ?, ?, ?)', [registerResp.credentialId, user.id, nickname, registerResp.privateKey]);
        registerResp.res.credentialNickname = nickname;

        const verifyResp = await instance({
            method: 'POST',
            url: `https://twostepverification.roblox.com/v1/users/${user.id}/configuration/security-key/enable-verify`,
            data: registerResp.res
        });

        // console.log(verifyResp.status)
        if (verifyResp.status != 200) {
            console.log(`Unknown error security key verify`, verifyResp.data);
            return { error: 'UNKNOWN_ERROR' };
        }

        return true;

    } else {

        const error = enableKeyResp.data.errors?.[0]?.code;
        if (!Number.isInteger(error)) {
            console.log(`Unknown resp security key enable`, enableKeyResp.data);
            return { error: 'UNKNOWN_ERROR' };
        }

        if (error == 0) {

            const neededChallenge = enableKeyResp.headers['rblx-challenge-type'];

            if (!neededChallenge) {
                console.log(`Unknown error security key enable`, enableKeyResp.data);
                return { error: 'UNKNOWN_ERROR' };
            }

            if (neededChallenge != 'twostepverification') {
                console.log(`Unknown challenge type`, neededChallenge);

                if (neededChallenge == 'reauthentication') return { error: 'AUTHENTICATOR_NOT_ENABLED' };
                return { error: 'UNKNOWN_ERROR' };
            }

            const metadata = JSON.parse(Buffer.from(enableKeyResp.headers['rblx-challenge-metadata'], 'base64').toString('ascii'));

            pending2fas[user.id] = {
                challengeId: enableKeyResp.headers['rblx-challenge-id'],
                metadataChallengeId: metadata.challengeId,
                securityKeys,
                user,
                listingItems,
                instance,
                createdAt: Date.now()
            };

            return { success: true, step: '2fa', challengeId: enableKeyResp.headers['rblx-challenge-id'] };

        } else if (error == 9) {
            return { error: 'AUTHENTICATOR_NOT_ENABLED' };
        } else if (error == 16) {
            return { error: 'SECURITY_KEYS_LIMIT' };
        } else {
            console.log(`Unknown error security key enable`, enableKeyResp.data);
            return { error: 'UNKNOWN_ERROR' };
        }

    }

}

async function listItems(req, res, user, listingItems) {

    const sellerInventory = await getInventory(req.userId);

    try {

        await doTransaction(async (connection, commit) => {

            await connection.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [req.userId]);

            const [[alreadyActive]] = await connection.query(
                'SELECT ml.id FROM marketplaceListings ml JOIN marketplaceListingItems mli ON ml.id = mli.marketplaceListingId WHERE mli.userAssetId IN(?) AND ml.status = ?',
                [listingItems.map(e => e.userAssetId), 'active']
            );
        
            if (alreadyActive) return res.status(400).json({ error: 'ITEM_ALREADY_LISTED' });
        
            const [result] = await connection.query('INSERT INTO marketplaceListings (sellerId) VALUES (?)', [req.userId]);
    
            const listing = {
                id: result.insertId,
                price: 0,
                items: []
            };
    
            let sqlItems = [];
    
            for (const item of listingItems) {
        
                const itemInfo = sellerInventory.find(i => i.userAssetId == item.userAssetId);
                if (!itemInfo) return res.status(400).json({ error: 'INVALID_INVENTORY' });
                if (itemInfo.isOnHold) return res.status(400).json({ error: 'ITEM_ON_HOLD' });
        
                const price = roundDecimal(itemInfo.price * (1 - (item.discount / 100)));
                listing.price = roundDecimal(listing.price + price);
        
                listing.items.push({
                    ...items[itemInfo.id],
                    discount: item.discount,
                    price
                });
    
                sqlItems.push([listing.id, itemInfo.id, item.userAssetId, item.discount])
        
            }
        
            if (listing.price < minListingPrice) return res.status(400).json({ error: 'MIN_LISTING_PRICE' });
            await connection.query('INSERT INTO marketplaceListingItems (marketplaceListingId, limitedId, userAssetId, discount) VALUES ?', [sqlItems]);
        
            await commit();
    
            marketplaceListings[listing.id] = listing;
            res.json({ success: true, listing });
            sendLog('market', `*${user.username}* (\`${user.id}\`) listed ${listing.items.length} item(s) for sale for :robux: R$${listing.price} (#${listing.id})`);

        });

    } catch (e) {
        console.error(e);
        res.status(400).json({ error: 'UNKNOWN_ERROR' });
    }

}

module.exports = router;