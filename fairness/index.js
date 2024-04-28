const crypto = require('crypto');
const { sql } = require('../database');

const sha256 = string => crypto.createHash('sha256').update(string).digest('hex');
const sha512 = string => crypto.createHash('sha512').update(string).digest('hex');

const generateServerSeed = () => crypto.randomBytes(32).toString('hex');
const generateClientSeed = (length = 10) => {

    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
    
}

const createUserSeeds = async (userId, connection = sql) => {

    const serverSeed = generateServerSeed();
    const clientSeed = generateClientSeed();

    await connection.query('INSERT INTO serverSeeds (userId, seed) VALUES (?, ?)', [userId, serverSeed]);
    await connection.query('INSERT INTO clientSeeds (userId, seed) VALUES (?, ?)', [userId, clientSeed]);

    return { serverSeed, clientSeed, nonce: 0 };

};

// async function test() {
    
//     const [users] = await sql.query('SELECT id FROM users');

//     for (const user of users) {
//         console.log(`Creating seeds for user ${user.id}`);
//         await createUserSeeds(user.id);
//     }

// }

// test();

const getUserSeeds = async (userId, connection = sql, lock = false) => {

    const [[userSeeds]] = await connection.query(`
        SELECT 
            serverSeeds.id AS serverSeedId,
            serverSeeds.seed AS serverSeed,
            clientSeeds.seed AS clientSeed,
            serverSeeds.nonce AS nonce
        FROM 
            serverSeeds
        INNER JOIN 
            clientSeeds ON (serverSeeds.userId = clientSeeds.userId AND clientSeeds.endedAt IS NULL)
        WHERE 
            serverSeeds.userId = ? AND
            serverSeeds.endedAt IS NULL${lock ? ' FOR UPDATE' : ''};
    `, [userId]);

    if (!userSeeds) {
        return createUserSeeds(userId, connection);
    }

    return userSeeds;

};

const combine = (serverSeed, clientSeed, nonce) => {
    return crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
}

const CHARSROLL = 15;
const MAXROLL = 100000;

const getResult = hashedValue => {
    const partHash = hashedValue.slice(0, CHARSROLL);
    const roll = parseInt(partHash, 16) % MAXROLL;
    return roll + 1;
};

module.exports = {
    sha256,
    sha512,
    getUserSeeds,
    createUserSeeds,
    generateServerSeed,
    generateClientSeed,
    combine,
    getResult
}