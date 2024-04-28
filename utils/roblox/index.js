const axios = require('axios');
const { getAgent, getProxy } = require('../proxies');
const { items } = require('./items');
const { formatConsoleError } = require('..');

// const assetTypes = {
//     '8': 'Hat',
//     '18': 'Face',
//     '19': 'Gear',
//     '41': 'HairAccesory',
//     '42': 'FaceAccesory',
//     '43': 'NeckAccesory',
//     '44': 'ShoulderAccesory',
//     '45': 'FrontAccesory',
//     '46': 'BackAccesory',
//     '47': 'WaistAccesory',
//     '67': 'JacketAccesory',
//     '68': 'SweatherAccesory',
//     '72': 'DressSkirtAccesory'
// };

// let cachedUsers = {};

async function getCurrentUser(cookie, proxy) {

    // if (cachedUsers[cookie] && cachedUsers[cookie].cachedAt > Date.now() - 60000) return cachedUsers[cookie];

    try {

        const opts = {
            url: 'https://www.roblox.com/mobileapi/userinfo',
            method: 'GET',
            headers: {
                'Cookie': `.ROBLOSECURITY=${cookie};`,
                // 'Accept': 'application/json',
            }
        };
    
        if (proxy) opts.httpsAgent = getAgent(proxy);
    
        const session = await axios(opts);
    
        /// console.log(session.data)
        const user = session.data.UserID && session.data;
        // if (user) cachedUsers[cookie] = { ...user, cachedAt: Date.now() };
    
        return user;

    } catch (e) {
        console.error(`Error getting current user:`, formatConsoleError(e));
        return false;
    }

}

const cachedInventories = {};

async function getInventory(userId, robloxInstance = axios) {

    const inventory = [];
    let cursor = '';

    while (true) {

        const page = await getInventoryPage(userId, cursor, robloxInstance);
        if (!page) return false;

        if (!page.data) break;
        
        page.data.forEach(e => {

            const item = items[e.assetId];
            if (!item) return;

            inventory.push({
                id: e.assetId,
                userAssetId: e.userAssetId,
                serialNumber: e.serialNumber,
                isOnHold: e.isOnHold,
                ...item
            });

        })
    
        if (!page.nextPageCursor) break;
        cursor = page.nextPageCursor;

    }

    return inventory;

}

async function getInventoryPage(userId, cursor, robloxInstance) {

    if (cachedInventories[userId] && cachedInventories[userId][cursor]) return cachedInventories[userId][cursor];
    if (!cachedInventories[userId]) cachedInventories[userId] = {};

    const opts = {
        url: `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles`,
        params: {
            limit: 100,
            cursor: cursor,
            sortOrder: 'Asc'
        }
    }

    try {
        const { data: page } = await robloxInstance(opts);
        cachedInventories[userId][cursor] = page;
        cachedInventories[userId].cachedAt = Date.now();
    
        return page;
    } catch (e) {
        console.error(`Error getting inventory page:`, formatConsoleError(e));
        return false;
    }

}

setInterval(() => {
    const now = Date.now();

    for (const [userId, inventory] of Object.entries(cachedInventories)) {
        if (inventory.cachedAt < now - 60000) {
            delete cachedInventories[userId];
        }
    }
}, 60000);

async function getThumbnails(body, retry = 0) {

    const proxy = getProxy(false, 'thumbnails');
    const agent = getAgent(proxy);

    try {

        const { data } = await axios({
            url: "https://thumbnails.roblox.com/v1/batch",
            method: "POST",
            httpsAgent: agent,
            data: body
        });

        
        return data;

    } catch (e) {
            
        if (retry < 4 && e.response?.status == 429) {
            return getThumbnails(body, retry + 1);
        }

        // console.error(e);
        return false;

    }

}

module.exports = {
    getCurrentUser,
    getInventory,
    cachedInventories,
    getThumbnails
}