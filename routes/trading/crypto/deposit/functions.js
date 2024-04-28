const axios = require('axios');
const { sql } = require('../../../../database');
const { formatConsoleError } = require('../../../../utils');

const Coinpayments = require('coinpayments');
const coinpayments = new Coinpayments({
    key: process.env.COINPAYMENTS_KEY,
    secret: process.env.COINPAYMENTS_SECRET
});


const cryptoData = {
    currencies: {
        'BTC': {
            id: 'BTC',
            name: 'Bitcoin',
            coingeckoId: 'bitcoin',
            confirmations: 2
        },
        'ETH': {
            id: 'ETH',
            name: 'Ethereum',
            coingeckoId: 'ethereum',
            confirmations: 3
        },
        'LTC': {
            id: 'LTC',
            name: 'Litecoin',
            coingeckoId: 'litecoin',
            confirmations: 3
        },
        'USDT.ERC20': {
            id: 'USDT.ERC20',
            name: 'USDT (ERC20)',
            coingeckoId: 'tether',
            confirmations: 3
        },
        'USDC': {
            id: 'USDC',
            name: 'USDC (ERC20)',
            coingeckoId: 'usd-coin',
            confirmations: 3
        },
        'BNB.BSC': {
            id: 'BNB.BSC',
            name: 'BNB (BSC)',
            coingeckoId: 'binancecoin',
            confirmations: 3
        },
        'BUSD.BEP20': {
            id: 'BUSD.BEP20',
            name: 'BUSD (BEP20)',
            coingeckoId: 'binance-usd',
            confirmations: 3
        },
        'DOGE': {
            id: 'DOGE',
            name: 'Dogecoin',
            coingeckoId: 'dogecoin',
            confirmations: 3
        }
    },
    robuxRate: {
        robux: 1000,
        usd: 3.5
    }
}

async function cacheCryptos() {

    const [cryptos] = await sql.query("SELECT id, name, coingeckoId, price FROM cryptos");

    for (const crypto of cryptos) {
        cryptoData.currencies[crypto.id].price = crypto.price;
    }

    if (Object.values(cryptoData.currencies).some(e => !e.price)) {
        await updateRates();
    } else {
        updateRates();
    }

}

async function updateRates() {

    try {

        const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
            params: {
                ids: Object.values(cryptoData.currencies).map(e => e.coingeckoId).join(','),
                vs_currencies: 'usd'
            },
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, decompress'
            }
        });

        const rates = await coinpayments.rates();
        const query = [];
    
        Object.values(cryptoData.currencies).forEach(currency => {
            cryptoData.currencies[currency.id].price = data[currency.coingeckoId].usd;
            cryptoData.currencies[currency.id].confirmations = rates[currency.id].confirms;
            cryptoData.currencies[currency.id].explorer = rates[currency.id].explorer;
            query.push([currency.id, currency.name, currency.coingeckoId, currency.price]);
        });
            
        cachedRates = data;
        cachedRates.cachedAt = Date.now();

        await sql.query(
            'INSERT INTO cryptos (id, name, coingeckoId, price) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price)',
            [query]
        );

    } catch (e) {
        console.error(`Error updating crypto prices:`, formatConsoleError(e));
    }

    setTimeout(updateRates, 1000 * 60 * 5); // 5min

}

module.exports = {
    cryptoData,
    cacheCryptos,
    coinpayments
}