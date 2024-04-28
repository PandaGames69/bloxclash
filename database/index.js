const mysql = require('mysql2/promise');

const connection = {
    host: 'localhost',
    user: process.env.SQL_USER,
    database: process.env.SQL_DB,
    password: process.env.SQL_PASS,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    typeCast: function (field, next) {
        if (field.type == "NEWDECIMAL") {
            const value = field.string();
            return (value === null) ? null : Number(value);
        }
        return next();
    }
};

const pool = mysql.createPool(connection);

// pool.on('connection', function (connection) {
//     console.log('Connection established');
// });

// pool.on('acquire', function (connection) {
//     console.log('Connection %d acquired', connection.threadId);
// });

// pool.on('release', function (connection) {
//     console.log('Connection %d released', connection.threadId);
// });

// pool.on('enqueue', function () {
//     console.log('Waiting for available connection slot');
// });

// pool.on('error', function (err) {
//     console.error('Pool error', err);
// });

async function doTransaction(transactionLogic) {

    const connection = await pool.getConnection();
    // if (!connection) throw new Error('Could not get connection from pool.');

    let hasEnded = false;

    async function commit() {
        if (hasEnded) throw new Error('Transaction has already been committed or rolled back.');
        const [commitResult] = await connection.commit();
        if (commitResult && commitResult.warningStatus) {
            throw new Error('Commit err: ' + commitResult.warningStatus);
        }
        hasEnded = true;
    }

    async function rollback() {
        if (hasEnded) throw new Error('Transaction has already been committed or rolled back.');
        const [rollbackResult] = await connection.rollback();
        if (rollbackResult && rollbackResult.warningStatus) {
            throw new Error('Rollback err: ' + rollbackResult.warningStatus);
        }
        hasEnded = true;
    }

    try {

        const [txResult] = await connection.beginTransaction();
        if (txResult && txResult.warningStatus) {
            throw new Error('Transaction err: ' + txResult.warningStatus);
        }

        const res = await transactionLogic(connection, commit, rollback);

        if (!hasEnded) await rollback();
        return res;
        
    } catch (err) {
        if (!hasEnded) await rollback();
        throw err;
    } finally {
        connection.release();
    }
}

module.exports = {
    sql: pool,
    doTransaction
};