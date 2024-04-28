const { items: limiteds } = require('../../../utils/roblox/items');
const { sql } = require('../../../database');
const { cryptoData } = require('../crypto/deposit/functions');

const axios = require('axios');

const adurite = axios.create({
    baseURL: 'https://aduriteintegration.com/api/v1',
    validateStatus: () => {
        return true;
    },
    headers: {
        'INTEGRATION-KEY': process.env.ADURITE_API_KEY,
        'content-type': 'application/json',
        'Accept-Encoding': 'gzip, deflate, decompress'
    }
});

const marketplaceListings = {};
adurite.listings = {};

async function cacheListings() {
    
    const [listings] = await sql.query('SELECT * FROM marketplaceListings WHERE buyerId IS NULL AND status = ?', ['active']);

    if (listings.length) {

        const [listingsItems] = await sql.query('SELECT * FROM marketplaceListingItems WHERE marketplaceListingId IN (?)', [listings.map(e => e.id)]);
    
        listings.forEach(listing => {
    
            const listingItems = [];
            let total = 0;
    
            listingsItems.forEach(item => {
            
                if (item.marketplaceListingId !== listing.id) return;
                const limited = limiteds[item.limitedId];
    
                const price = limited.price * (100 - item.discount) / 100;
                total += price;
    
                listingItems.push({
                    ...limited,
                    discount: item.discount,
                    price
                });
    
            });
    
            marketplaceListings[listing.id] = {
                id: listing.id,
                sellerId: listing.sellerId,
                price: total,
                items: listingItems,
                createdAt: listing.createdAt
            }
    
        });

    }
    
    setTimeout(cacheListings, 1000 * 60 * 5); // 5m

}

async function updateAduriteListings() {

    const [
        { data: listingsData },
        { data: balanceData }
    ] = await Promise.all([
        adurite.get('/find-all-listings'),
        adurite.get('/balance')
    ]);

    if (!balanceData.ok) {
        console.log('Error updating adurite balance', balanceData);
        // return setTimeout(updateAduriteListings, 1000 * 30); // 30s
    } else {
        adurite.balance = balanceData.data.balance;
    }

    if (!listingsData.ok) {
        console.log('Error updating adurite listings', listingsData);
        return setTimeout(updateAduriteListings, 1000 * 30); // 30s
    }

    const listings = {};

    for (const [id, listing] of Object.entries(listingsData)) {

        // console.log(id, listing)
        if (!listing.limited_id) continue;

        const priceUsd = +listing.price;
        // if (priceUsd > balance) continue;
        // console.log(priceUsd);

        const price = Math.ceil(priceUsd / cryptoData.robuxRate.usd * cryptoData.robuxRate.robux);
        const limited = limiteds[listing.limited_id];

        listings[`adurite-${id}`] = {
            id: `adurite-${id}`,
            adurite: id,
            price,
            usd: priceUsd,
            items: [{
                ...limited,
                discount: 0,
                price
            }],
            price
        }

    }

    adurite.listings = listings;
    setTimeout(updateAduriteListings, 1000 * 30);

}

updateAduriteListings();

async function checkTradeSettings(instance) {
    const { data: userSettings } = await instance('https://apis.roblox.com/user-settings-api/v1/user-settings', {
        headers: {
            'Cookie': `${instance.defaults.headers['Cookie']};RBXEventTrackerV2=CreateDate=10/11/2022 03:00:00 PM&rbxid=1&browserid=1`,
        }
    });
    if (userSettings.tradeQualityFilter != 'None') return 'TRADE_QUALITY_FILTER';
    if (userSettings.whoCanSeeMyInventory != 'AllUsers') return 'INVENTORY_PRIVACY';
    if (userSettings.whoCanTradeWithMe != 'All') return 'TRADE_PRIVACY';
}

const sell2FAs = {};
const buy2FAs = {};

setInterval(() => {
    clearOld2FAs(sell2FAs);
    clearOld2FAs(buy2FAs);
}, 1000 * 60 * 5);

function clearOld2FAs(obj) {
    for (const id in obj) {
        if (Date.now() - obj[id].createdAt > 1000 * 60 * 5) delete obj[id];
    }
}

module.exports = {
    sell2FAs,
    buy2FAs,
    marketplaceListings,
    checkTradeSettings,
    cacheListings,
    adurite
}