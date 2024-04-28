const { sql } = require('../../database');
const { sendLog } = require('../../utils');

const bannedUsers = new Set();
const sponsorLockedUsers = new Set();
const bannedPhrases = {};
const enabledFeatures = {};
const lastLogouts = {};

const depositBonus = 0; // 0 || 5 / 100;
const xpMultiplier = 1; // 1 || 2;

async function cacheAdmin() {

    const [bans] = await sql.query('SELECT id, banned, sponsorLock FROM users WHERE banned = 1 OR sponsorLock = 1');
    bans.forEach(e => {
        if (e.banned) bannedUsers.add(e.id);
        if (e.sponsorLock) sponsorLockedUsers.add(e.id);
    });

    const [phrases] = await sql.query('SELECT id, phrase FROM bannedPhrases');
    phrases.forEach(e => bannedPhrases[e.id] = e.phrase);

    const [features] = await sql.query('SELECT id, enabled FROM features');
    features.forEach(e => enabledFeatures[e.id] = !!e.enabled);

    const [logouts] = await sql.query('SELECT id, lastLogout FROM users WHERE lastLogout IS NOT NULL');
    logouts.forEach(e => lastLogouts[e.id] = e.lastLogout.valueOf());

}

// lock account if balance is over 150k and deposited is less than balance - 150k

const suspiciousAmount = 285715;
async function checkAccountLock(user) {

    if (user.accountLock) return true;
    if (user.verified || user.sponsorLock) return false;

    if (user.balance < suspiciousAmount) return false;

    const [[{ deposited }]] = await sql.query('SELECT SUM(amount) AS deposited FROM transactions WHERE userId = ? AND type = "deposit"', [user.id]);
    if (deposited * 1.5 >= user.balance) return false;

    sendLog('admin', `Locking account ${user.username} for kyc (\`${user.id}\`)`);
    sql.query('UPDATE users SET accountLock = 1 WHERE id = ?', [user.id]);
    
    return true;

}

module.exports = {
    cacheAdmin,
    bannedUsers,
    checkAccountLock,
    bannedPhrases,
    enabledFeatures,
    sponsorLockedUsers,
    lastLogouts,
    depositBonus,
    xpMultiplier
}