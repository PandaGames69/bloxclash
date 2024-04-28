require('dotenv').config();
const express = require('express');
const nocache = require("nocache");
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const rfs = require('rotating-file-stream');
const io = require('./socketio/server');
const cookieParser = require('cookie-parser');

const app = express();
app.disable('x-powered-by');

if (process.env.NODE_ENV == 'development') {

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "*");
        res.header("Access-Control-Allow-Methods", "*");
        res.header('Access-Control-Max-Age', '7200');
        next();
    });

} else {

    app.use((req, res, next) => {
        if (req.path.startsWith('/slots/hacksaw')) {
            res.header("Access-Control-Allow-Origin", "https://static-live.hacksawgaming.com");
            res.header("Access-Control-Allow-Headers", "*");
            res.header("Access-Control-Allow-Methods", "*");
            res.header('Access-Control-Max-Age', '7200');
        }
        next();
    });

}

app.options('*', (req, res) => {
    res.sendStatus(204);
});

app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV == 'development') {
    app.use(morgan('dev', {
        skip: (req, res) => req.url.endsWith('/img')
    }));
}

morgan.token('ip', function(req, res) {
    return req.headers['cf-connecting-ip']
});

morgan.token('user-agent', function(req, res) {
    return req.headers['user-agent']
});

const logDirectory = path.join(__dirname, 'logs');

const accessLogStream = rfs.createStream('access.log', {
    interval: '1d',
    path: logDirectory,
    size: "10M",
    // compress: 'gzip'
});

app.use(morgan('[:date[clf]] :ip :method :url :status :response-time ms - :user-agent', {
    stream: accessLogStream,
    skip: (req, res) => req.url.endsWith('/img')
}));

app.use(bodyParser.json({
    verify: function (req, res, buf, encoding) {
        req.rawJsonBody = buf;
    }
}));

app.use(bodyParser.urlencoded({
    extended: true,
    verify: function (req, res, buf, encoding) {
        req.rawUrlBody = buf;
    }
}));

app.use(nocache());
app.use(cookieParser());

const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');
const itemsRoute = require('./routes/items');
const tradingRoute = require('./routes/trading');
const discordRoute = require('./routes/discord');
const rainRoute = require('./routes/rain');
const leaderboardRoute = require('./routes/leaderboard');
const casesRoute = require('./routes/games/cases');
const battlesRoute = require('./routes/games/battles');
const rouletteRoute = require('./routes/games/roulette');
const crashRoute = require('./routes/games/crash');
const coinflipRoute = require('./routes/games/coinflip');
const jackpotRoute = require('./routes/games/jackpot');
const slotsRoute = require('./routes/games/slots');
const minesRoute = require('./routes/games/mines');
const blackjackRoute = require('./routes/games/blackjack');
const adminRoute = require('./routes/admin');
const surveysRoute = require('./routes/surveys');
const fairnessRoute = require('./routes/fairness');

app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/items', itemsRoute);
app.use('/trading', tradingRoute);
app.use('/discord', discordRoute);
app.use('/rain', rainRoute);
app.use('/leaderboard', leaderboardRoute);
app.use('/cases', casesRoute);
app.use('/battles', battlesRoute);
app.use('/roulette', rouletteRoute);
app.use('/crash', crashRoute);
app.use('/coinflip', coinflipRoute);
app.use('/jackpot', jackpotRoute);
app.use('/slots', slotsRoute);
app.use('/mines', minesRoute);
app.use('/blackjack', blackjackRoute);
app.use('/admin', adminRoute);
app.use('/surveys', surveysRoute);
app.use('/fairness', fairnessRoute);

app.get('/', (req, res) => {
    res.send('Hey, hi :)');
});

const { cacheBets } = require('./socketio/bets');
const { cacheRains } = require('./socketio/rain');
const { cacheBattles } = require('./routes/games/battles/functions');
const { cacheCases, cacheDrops } = require('./routes/games/cases/functions');
const { cacheCrash } = require('./routes/games/crash/functions');
const { cacheCryptos } = require('./routes/trading/crypto/deposit/functions');
const { cacheWithdrawalCoins } = require('./routes/trading/crypto/withdraw/functions');
const { cacheJackpot } = require('./routes/games/jackpot/functions');
const { cacheRoulette } = require('./routes/games/roulette/functions');
const { cacheCoinflips } = require('./routes/games/coinflip/functions');
const { cacheChannels } = require('./socketio/chat/functions');
const { cacheItems } = require('./utils/roblox/items');
const { cacheListings } = require('./routes/trading/limiteds/functions');
const { cacheAdmin } = require('./routes/admin/config');
const { cacheSlots } = require('./routes/games/slots/functions');
const { cacheSurveys } = require('./routes/surveys/functions');
const { cacheLeaderboards } = require('./routes/leaderboard/functions');

async function start() {

    await Promise.all([
        cacheItems()
    ])

    const promises = [
        cacheBets,
        cacheRains,
        cacheBattles,
        cacheCases,
        // cacheDrops,
        cacheCrash,
        cacheCryptos,
        cacheWithdrawalCoins,
        cacheJackpot,
        cacheRoulette,
        cacheCoinflips,
        cacheChannels,
        cacheListings,
        cacheAdmin,
        cacheSlots,
        cacheSurveys,
        cacheLeaderboards
    ];

    await Promise.all(promises.map((p) => timedPromise(p(), p.name)));
    // console.log(results.map(e => `${e.name} completed in ${e.timeTaken}ms`));

    const port = process.env.PORT || 3000;

    const serverInstance = app.listen(port, () => {
        console.log('Listening on port ' + port);
    });
    
    require('./socketio');
    io.attach(serverInstance, { cors: { origin: '*' } });

}

function timedPromise(promise, name) {
    const startTime = Date.now();
    return promise.then(result => {
        const endTime = Date.now();
        console.log(`${name} completed in ${endTime - startTime}ms`);
        return { name, result, timeTaken: endTime - startTime };
    });
}

start();