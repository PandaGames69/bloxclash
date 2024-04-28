const axios = require('axios');
const { default: PQueue } = require('p-queue');
const logsQueue = new PQueue({ intervalCap: 1, interval: 1000 });

const { sql } = require('../database');
const levels = Object.entries(require('./levels.json')).sort((a, b) => b[1] - a[1]);
const io = require('../socketio/server');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getUserLevel(xp) {    

    for (let i = 0; i < levels.length; i++) {
        const [level, xpRequired] = levels[i];
        if (xp >= xpRequired) return +level;
    }

}

function roundDecimal(amount, dec = 2) {
    const number = typeof amount == 'string' ? parseFloat(amount) : amount;
    return Math.floor(number * Math.pow(10, dec)) / Math.pow(10, dec);
}

// async function updateCases() {

//     const cases = require('./cases3.json');

//     const connection = await sql.getConnection();
//     await connection.beginTransaction();

//     for (let i = 0; i < cases.length; i++) {

//         const caseInfo = cases[i];
//         const slug = caseInfo.slug;

//         const [[existingCase]] = await connection.query('SELECT * FROM cases WHERE slug = ?', [slug]);

//         let caseId;
        
//         if (existingCase) {
            
//             caseId = existingCase.id;
//             console.log(`Updating case`, i + 1, `of`, cases.length, `(${caseInfo.name})`);
//             const [[existingVersion]] = await connection.query('SELECT id FROM caseVersions WHERE caseId = ? AND endedAt IS NULL ORDER BY id DESC LIMIT 1', [existingCase.id]);
            
//             if (existingVersion) {
//                 await connection.query('UPDATE caseVersions SET endedAt = NOW() WHERE id = ?', [existingVersion.id]);
//             } else {
//                 console.warn(`No existing version found for case ${existingCase.id}`);
//             }

//         } else {

//             console.log(`Case ${slug} not found`);
//             return await connection.rollback();

//             console.log(`Inserting case`, i + 1, `of`, cases.length, `(${caseInfo.name})`);

//             const [caseResult] = await connection.query('INSERT INTO cases (name, slug, img) VALUES (?, ?, ?)', [caseInfo.name, slug, `/public/cases/${slug}.png`]);
//             caseId = caseResult.insertId;

//         }

//         const [versionResult] = await sql.query('INSERT INTO caseVersions (caseId, price) VALUES (?, ?)', [caseId, caseInfo.price]);
//         const versionId = versionResult.insertId;

//         for (let j = 0; j < caseInfo.items.length; j++) {

//             const item = caseInfo.items[j];
//             console.log(`Inserting item`, j + 1, `of`, caseInfo.items.length, `(${item.name})`);

//             await sql.query(
//                 'INSERT INTO caseItems (caseVersionId, robloxId, name, img, price, rangeFrom, rangeTo) VALUES (?, ?, ?, ?, ?, ?, ?)',
//                 [versionId, item.id, item.name, null, item.price, item.rangeFrom, item.rangeTo]
//             );

//         }

//     }

//     console.log('Committing case updates');
//     await connection.commit();

// }

// updateCases();

function getRobloxApiInstance(httpsAgent, robloxCookie, userAgent, throwOnErrors = true) {

    const instanceConfig = {
        timeout: 8000,
        httpsAgent,
        headers: {
            'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
            // 'Origin': 'https://www.roblox.com',
            // 'Referer': 'https://www.roblox.com/',
            // 'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
            // 'sec-ch-ua-platform': '"Windows"',
            // 'sec-ch-ua-mobile': '?0',
            // 'sec-fetch-site': 'cross-site',
            // 'sec-fetch-mode': 'cors',
            // 'sec-fetch-dest': 'empty'
        }
    }

    if (robloxCookie) {
        instanceConfig.headers['Cookie'] = `.ROBLOSECURITY=${robloxCookie}`;
    }

    if (!throwOnErrors) {
        instanceConfig.validateStatus = () => {
            return true;
        }
    }

    const robloxApi = axios.create(instanceConfig);

    robloxApi.interceptors.request.use(config => {

        if (config.method != 'get') {
            
            if (!Object.keys(config.headers).some(h => h.toLowerCase() == 'content-type')) {
                config.headers['Content-Type'] = 'application/json';
            }

            if (robloxApi.csrf) {
                // console.log('Setting csrf')
                config.headers['X-Csrf-Token'] = robloxApi.csrf;
            }

        }

        return config;

    }, error => {
        return Promise.reject(error);
    });

    robloxApi.interceptors.response.use((response) => {
        if (response.status == 403) {
            const retryRequest = handleCsrfError(robloxApi, response.config, response.headers);
            if (retryRequest) return retryRequest;
        }
        return response;
    }, async function (error) {
        if (error.response && error.response.status == 403) {
            const retryRequest = handleCsrfError(robloxApi, error.config, error.response.headers);
            if (retryRequest) return retryRequest;
        }
        return Promise.reject(error);
    });

    return robloxApi;

}

function handleCsrfError(robloxApi, originalRequest, headers) {
    const csrf = headers['x-csrf-token'];

    if (csrf && !originalRequest._retry) {
        originalRequest._retry = true;
        robloxApi.csrf = csrf;
        // console.log(originalRequest.url, 'Fetched csrf')
        return robloxApi(originalRequest);
    }

    return null;
}

function formatConsoleError(error) {

    let formattedError = 'An error occurred.';
    const requestUrl = (error.config && error.config.url) ? error.config.url : 'unknown URL';

    if (error.response) {

        formattedError = `Request to ${requestUrl} failed. Server responded with status code ${error.response.status}.`;
        if (error.response.data) {
            formattedError += ` Response body: ${JSON.stringify(error.response.data)}`;
        }

    } else if (error.request) {
        formattedError = `No response was received from ${requestUrl}. ${error.message}`;
    } else {
        formattedError = error.message;
    }

    if (error.stack) {
        const errorLines = error.stack.split('\n');
        if (errorLines[1]) {
            formattedError += ` Occurred at: ${errorLines[1].trim()}`;
        }
    }

    return formattedError;

}

function cacheRes(req, res, next) {

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Surrogate-Control', 'public, max-age=3600');

    const date = new Date();
    date.setHours(date.getHours() + 1);
    res.setHeader('Expires', date.toUTCString());

    next();

}

function mapUser(user) {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        xp: user.xp
    }
}

const slackWebhooks = {
	bets: 'https://hooks.slack.com/services/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',
	highBets: 'https://hooks.slack.com/services/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',
	robuxExchange: 'https://hooks.slack.com/services/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',
	cryptoDeposits: 'https://hooks.slack.com/services/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',
    cryptoWithdraws: 'https://hooks.slack.com/services/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',
    cardDeposits: 'https://hooks.slack.com/services/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',
	giftCards: 'https://hooks.slack.com/services/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',
	market: 'https://hooks.slack.com/services/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',
	rain: 'https://hooks.slack.com/services/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',
	rakeback: 'https://hooks.slack.com/services/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',
	leaderboard: 'https://hooks.slack.com/services/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',
	admin: 'https://hooks.slack.com/services/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',
	tips: 'https://hooks.slack.com/services/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',
	battles: 'https://hooks.slack.com/services/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',
	dev: 'https://hooks.slack.com/services/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',
	promo: 'https://hooks.slack.com/services/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',
	affiliate: 'https://hooks.slack.com/services/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',
    surveys: 'https://hooks.slack.com/services/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',
    earn: 'https://hooks.slack.com/services/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'
}

async function sendLog(channel, message) {

    await logsQueue.add(async () => {

        if (process.env.NODE_ENV != 'production') channel = 'dev';

        if (typeof message === 'string') {
            message = {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": message
                        }
                    }
                ]
            }
        }

        const webhook = slackWebhooks[channel];
        if (!webhook) return console.log(`[WARNING] The webhook for ${channel} could not be found.`);

        try {
            await axios.post(webhook, message);
        } catch (e) {
            console.log(`[WARNING] An error occurred while sending a message to ${channel}: ${e.message}`);
        }

    });

}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function newNotification(userId, type, content, connection = sql) {

    await connection.query('INSERT INTO notifications (userId, type, content) VALUES (?, ?, ?)', [userId, type, JSON.stringify(content)]);
    io.to(userId).emit('notifications', 'add', 1);

}

async function xpChanged(userId, oldXp, newXp, connection = sql) {

    const oldLevel = getUserLevel(oldXp);
    const newLevel = getUserLevel(newXp);

    if (newLevel > oldLevel) {
        await newNotification(userId, 'level-up', { level: newLevel }, connection);
    }

    io.to(userId).emit('xp', newXp);

}

module.exports = {
    getUserLevel,
    formatConsoleError,
    roundDecimal,
    mapUser,
    getRobloxApiInstance,
    cacheRes,
    sleep,
    sendLog,
    xpChanged,
    hourMs: 3.6e+6,
    getRandomInt,
    newNotification,
    xpChanged
}