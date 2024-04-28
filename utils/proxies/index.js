const fs = require('fs');
const path = require('path');
const HttpsProxyAgent = require('https-proxy-agent');

const proxies = getProxies('proxies.txt');
shuffleArray(proxies);

const residentialProxies = getProxies('proxies2.txt');
shuffleArray(residentialProxies);

const slotsProxies = getProxies('proxies3.txt');
shuffleArray(slotsProxies);

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getProxies(file) {

    const data = fs.readFileSync(path.join(__dirname, file), 'utf8');
    return data.split('\n').map(e => {

        const raw = e.replace('\r', '');
        return parseProxy(raw);

    }).filter(e => e);

}

function parseProxy(raw) {
    
    const [host, port, username, password] = raw.split(':');
    if (!password) return false;

    return { raw, host, port, username, password, lastUsedAt: {} };

}

function getAgent(proxy) {

    if (proxy instanceof HttpsProxyAgent) return proxy;
    if (typeof proxy == 'string') proxy = parseProxy(proxy);

    if (!proxy?.host) return false;

    const httpsAgent = new HttpsProxyAgent({host: proxy.host, port: proxy.port, auth: `${proxy.username}:${proxy.password}`, keepAlive: true, rejectUnauthorized: false});
    return httpsAgent;
    
}

function getProxy(residential = false, purpose = 'login') {

    const list = residential ? residentialProxies : proxies;
    let proxy = list.find(e => !e.lastUsedAt[purpose]);

    if (!proxy) {
        proxy = list.sort((a, b) => a.lastUsedAt[purpose] - b.lastUsedAt[purpose])[0];
    }

    proxy.lastUsedAt[purpose] = Date.now();
    return proxy;

}

function getSlotsProxy(purpose = 'hacksaw') {

    const list = slotsProxies;
    let proxy = list.find(e => !e.lastUsedAt[purpose]);

    if (!proxy) {
        proxy = list.sort((a, b) => a.lastUsedAt[purpose] - b.lastUsedAt[purpose])[0];
    }

    proxy.lastUsedAt[purpose] = Date.now();
    return proxy;

}

module.exports = {
    getAgent,
    getProxy,
    getSlotsProxy
}
