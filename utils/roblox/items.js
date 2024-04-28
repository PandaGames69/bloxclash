const axios = require('axios');
const path = require('path');
const fs = require('fs');

const jsonPath = path.join(__dirname, 'items.json');

const items = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf8')) : {};

// function getRarity(price) {

//     if (price < 1000) {
//         return 5; // Grey
//     } else if (price < 10000) {
//         return 4; // Blue
//     } else if (price < 50000) {
//         return 3; // Pink
//     } else if (price < 250000) {
//         return 2; // Red
//     } else {
//         return 1; // Gold
//     }

// }

async function cacheItems() {

    const { data } = await axios.get('https://www.rolimons.com/catalog');

    const script = data.split('item_details = ');
    const object = JSON.parse(script[1].split(';')[0]);
        
    Object.entries(object).forEach(([key, props]) => {

        const name = props[0];
        const assetType = props[1];

        // const date_added = new Date(props[4] * 1000);
        // const bestPrice = props[5];
        const rap = props[8];
        // const available_copies = props[11] - props[12];
        // const bc_copies = props[13];
        // const acronym = props[15];
        // const display_value = props[16];

        // const demandId = props[17];
        // const demand = ['Terrible', 'Low', 'Normal', 'High', 'Amazing'][demandId];

        // const trendId = props[18];
        // const trend = ["Lowering", "Unstable", "Stable", "Raising", "Fluctuating"][trendId];

        // const projected = !!props[19];
        // const hyped = props[20];
        // const rare = props[21];

        const value = props[22];
        const img = props[23];

        items[key] = {
            id: key,
            name,
            assetType,
            price: value || rap,
            // date_added,
            // bestPrice,
            // rap,
            // available_copies,
            // bc_copies,
            // acronym,
            // display_value,
            // demand,
            // trend,
            // projected,
            // hyped,
            // rare,
            // value,
            img
        }

        // items[key].rarity = getRarity(items[key].price);
        // delete items[key].rarity;

    });

    await fs.promises.writeFile(jsonPath, JSON.stringify(items, null, 4));
    
    setTimeout(cacheItems, 1000 * 60 * 60); // 1h

}

module.exports = {
    items,
    cacheItems
}