const crypto = require('crypto');
const axios = require('axios');

const { sql } = require('../../../../database');
const { formatConsoleError, sendLog } = require('../../../../utils');
const { default: PQueue } = require('p-queue');

const withdrawalCoins = {
    'BTC': {},
    'ETH': {},
    'LTC': {},
    'BNB': {},
    'USDC': {},
    'USDT': {},
    'DOGE': {}
};

const mexc = axios.create({
    baseURL: 'https://api.mexc.com',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-MEXC-APIKEY': process.env.MEXC_API_KEY,
    }
});

mexc.interceptors.request.use((config) => {

    if (!config.sign) return config;

    if (!config.params) config.params = {};
    config.params.timestamp = Date.now();

    config.params.signature = getSignature(new URLSearchParams(config.params).toString() + new URLSearchParams(config.data).toString());
    return config;

}, (error) => {
    return Promise.reject(error);
});

const chainsConfig = {
    'BTC': {
        validator: 'btc',
        explorer: 'https://www.blockchain.com/explorer/transactions/btc/{id}'
    },
    'BEP20(BSC)': {
        validator: 'eth',
        explorer: 'https://bscscan.com/tx/{id}'
    },
    'ERC20': {
        validator: 'eth',
        explorer: 'https://etherscan.io/tx/{id}'
    },
    'Arbitrum One': {
        validator: 'eth',
        explorer: 'https://arbiscan.io/tx/{id}'
    },
    'OP': {
        validator: 'eth',
        explorer: 'https://optimistic.etherscan.io/tx/{id}'
    },
    'LTC': {
        validator: 'ltc',
        explorer: 'https://blockchair.com/litecoin/transaction/{id}'
    },
    'ALGO': {
        validator: 'algo',
        explorer: 'https://algoexplorer.io/tx/{id}'
    },
    'MATIC': {
        validator: 'matic',
        explorer: 'https://polygonscan.com/tx/{id}'
    },
    'TRC20': {
        validator: 'trx',
        explorer: 'https://tronscan.org/#/transaction/{id}'
    },
    'DOGE': {
        validator: 'doge',
        explorer: 'https://blockchair.com/dogecoin/transaction/{id}'
    }
}

const defaultCurrency = 'USDT';
const defaultCurrencyPrice = 1;

async function cacheWithdrawalCoins() {
    
    const [
        { data },
        { data: prices }
    ] = await Promise.all([
        mexc('/api/v3/capital/config/getall', { sign: true }),
        mexc(`/api/v3/ticker/price`)
    ]);

    // console.log(prices);

    for (const currency of data) {

        if (!withdrawalCoins[currency.coin]) continue;
        const price = currency.coin === defaultCurrency ? defaultCurrencyPrice : prices.find(e => e.symbol === `${currency.coin}USDT`)?.price;
        
        if (!price) {
            if (!withdrawalCoins[currency.coin].price) throw new Error(`No price found for ${currency.coin}`);
            console.log(`No price found for ${currency.coin}`);
            continue;
        }

        const chains = [];
        const minWithdraw = 5.2 / price;

        for (const chain of currency.networkList) {
        
            if (!chain.withdrawEnable) continue;
            if (!chainsConfig[chain.network]) continue;

            chains.push({
                id: chain.network,
                coinName: chain.name,
                fee: +chain.withdrawFee,
                min: currency.coin == defaultCurrency ? +chain.withdrawMin : Math.max(+chain.withdrawMin, minWithdraw),
                max: +chain.withdrawMax
            });

        }

        if (!chains.length) {
            console.log(`No chains found for ${currency.coin}`);
            continue;
        }

        withdrawalCoins[currency.coin] = {
            id: currency.coin,
            name: currency.name,
            price: +price,
            chains
        }

    }

    setTimeout(cacheWithdrawalCoins, 1000 * 60 * 5); // 5 minutes

}

function getSignature(data) {
    return crypto.createHmac('sha256', process.env.MEXC_API_SECRET).update(data).digest('hex');
}

const balanceQueue = new PQueue({ interval: 1000, intervalCap: 2 });

async function getWalletBalance(asset = defaultCurrency) {
    
    return balanceQueue.add(async () => {

        const { data } = await mexc('/api/v3/account', { sign: true });

        const balance = data.balances.find(e => e.asset === asset);
        return balance ? Math.ceil(+balance.free) : 0;

    });
    
}

async function updateSentWithdrawals() {

    const [pendingTxs] = await sql.query('SELECT id, exchangeId, currency, chain, userId FROM cryptoWithdraws WHERE status = ?', ['sent']);
    const pendingTxsMap = new Map(pendingTxs.map(e => [e.exchangeId, e]));

    if (pendingTxs.length) {

        try {

            const { data } = await mexc('/api/v3/capital/withdraw/history', { sign: true });

            for (const tx of data) {
    
                if (!tx.txId) continue;
                const pendingTx = pendingTxsMap.get(tx.id);
                if (!pendingTx) continue;
    
                await sql.query('UPDATE cryptoWithdraws SET txId = ?, status = ? WHERE id = ?', [tx.txId, 'completed', pendingTx.id]);
                await sql.query('UPDATE transactions SET type = ? WHERE type = ? AND method = ? AND methodId = ? AND userId = ?', ['withdraw', 'out', 'crypto', pendingTx.id, pendingTx.userId]);

                const explorer = chainsConfig[pendingTx.chain].explorer.replace('{id}', tx.txId);
                sendLog('cryptoWithdraws', `Withdraw #${pendingTx.id} completed.\n${explorer}`);
    
            }

        } catch (e) {
            console.error(formatConsoleError(e));
        }

    }

    setTimeout(updateSentWithdrawals, 1000 * 60 * 1); // 1 minute

}

updateSentWithdrawals();

module.exports = {
    mexc,
    withdrawalCoins,
    chainsConfig,
    cacheWithdrawalCoins,
    defaultCurrency,
    defaultCurrencyPrice,
    getWalletBalance
}