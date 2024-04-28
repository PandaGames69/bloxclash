const io = require('../../../socketio/server');
const { sql } = require('../../../database');

const topDropPrice = 25000;
const limit = 15;

const cachedCases = {};

const drops = {
    all: [],
    top: []
}

async function cacheCases() {

    const [cases] = await sql.query(`
        SELECT c.id, c.name, c.slug, c.img, cv.price, cv.id as revId, cv.createdAt as modifiedAt FROM cases c
        INNER JOIN caseVersions cv ON c.id = cv.caseId AND cv.endedAt IS NULL
    `);

    const [items] = await sql.query(`
        SELECT id, robloxId, name, img, price, rangeFrom, rangeTo, caseVersionId FROM caseItems WHERE caseVersionId IN(?) ORDER BY price DESC;
    `, [cases.map(e => e.revId)]);

    for (const caseInfo of cases) {

        const caseItems = items.filter(e => e.caseVersionId === caseInfo.revId);

        delete caseInfo.revId;

        cachedCases[caseInfo.slug] = {
            ...caseInfo,
            items: caseItems.map(e => mapItem(e))
        }

    }

    setTimeout(cacheCases, 1000 * 60 * 60 * 1)

}

async function cacheDrops(top = false) {

    const now = Date.now();

    const [results] = await sql.query(`
        SELECT cases.slug, cases.name as caseName, cases.img as caseImg,
        users.id as userId, users.username, users.xp,
        caseItems.robloxId, caseItems.name, caseItems.img, caseItems.price, caseItems.rangeFrom, caseItems.rangeTo
        FROM caseOpenings INNER JOIN caseVersions ON caseOpenings.caseVersionId = caseVersions.id
        INNER JOIN cases ON caseVersions.caseId = cases.id
        INNER JOIN users ON caseOpenings.userId = users.id INNER JOIN caseItems ON caseOpenings.caseItemId = caseItems.id
        ${top ? `WHERE caseItems.price > ${topDropPrice}` : ''} ORDER BY caseOpenings.id DESC LIMIT ${limit}
    `);

    const after = Date.now();
    console.log(`Drops${top ? ' top': ''} took ${after - now}ms`);

    drops[top ? 'top' : 'all'] = results.map(e => {

        const item = mapItem(e);

        return {
            user: {
                id: e.userId,
                username: e.username,
                xp: e.xp
            },
            case: {
                name: e.caseName,
                slug: e.slug,
                img: e.caseImg
            },
            item: item,
            top: item.price >= topDropPrice
        }
        
    });
    
    if (!top) await cacheDrops(true);

}

function newDrops(user, caseInfo, results) {

    io.to('cases').except(user.id).emit('cases:drops', results.map(result => {
        
        const data = {
            user: {
                id: user.id,
                username: user.username,
                xp: user.xp
            },
            case: {
                name: caseInfo.name,
                slug: caseInfo.slug,
                img: caseInfo.img
            },
            item: result.item,
            top: result.item.price >= topDropPrice
        }

        drops.all.unshift(data);
        if (drops.all.length > limit) {
            drops.all.splice(-(drops.all.length - limit));
        }

        if (data.top) {
            drops.top.unshift(data);
            if (drops.top.length > limit) {
                drops.top.splice(-(drops.top.length - limit));
            }
        }

        return data;

    }));

}

function getItemProbability(rangeFrom, rangeTo) {
    let totalProbability = 100000;
    let itemRange = rangeTo - rangeFrom + 1;
    return (itemRange / totalProbability) * 100;
}

function mapItem(e) {

    return {
        id: e.id,
        name: e.name,
        img: e.img ? e.img : `/items/${e.robloxId}/img`,
        price: e.price,
        probability: +getItemProbability(e.rangeFrom, e.rangeTo).toFixed(3) // roundDecimal(getItemProbability(e.rangeFrom, e.rangeTo), 3)
    }

}

module.exports = {
    cachedCases,
    cacheCases,
    cacheDrops,
    newDrops,
    getItemProbability,
    mapItem,
    cachedDrops: drops
}