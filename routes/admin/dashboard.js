const express = require('express');
const router = express.Router();

const { sql } = require('../../database');
const { cryptoData } = require('../trading/crypto/deposit/functions');
const { roundDecimal } = require('../../utils');

router.get('/', async (req, res) => {

    const [[cryptoWithdraws]] = await sql.query(`
        SELECT 
            COALESCE(SUM(fiatAmount), 0) AS total,
            COALESCE(SUM(CASE WHEN modifiedAt >= NOW() - INTERVAL 1 DAY THEN fiatAmount ELSE 0 END), 0) AS lastDay,
            COALESCE(SUM(CASE WHEN modifiedAt >= NOW() - INTERVAL 7 DAY THEN fiatAmount ELSE 0 END), 0) AS last7d,
            COALESCE(SUM(CASE WHEN modifiedAt >= NOW() - INTERVAL 31 DAY THEN fiatAmount ELSE 0 END), 0) AS last31d
        FROM cryptoWithdraws
        WHERE status = 'completed';
    `)

    const [[cryptoDeposits]] = await sql.query(`
        SELECT
            COALESCE(SUM(fiatAmount), 0) AS total,
            COALESCE(SUM(CASE WHEN createdAt >= NOW() - INTERVAL 1 DAY THEN fiatAmount ELSE 0 END), 0) AS lastDay,
            COALESCE(SUM(CASE WHEN createdAt >= NOW() - INTERVAL 7 DAY THEN fiatAmount ELSE 0 END), 0) AS last7d,
            COALESCE(SUM(CASE WHEN createdAt >= NOW() - INTERVAL 31 DAY THEN fiatAmount ELSE 0 END), 0) AS last31d
        FROM cryptoDeposits;
    `);

    const [[creditCardDeposits]] = await sql.query(`
        SELECT
            COALESCE(SUM(fiatAmount), 0) AS total,
            COALESCE(SUM(CASE WHEN modifiedAt >= NOW() - INTERVAL 1 DAY THEN fiatAmount ELSE 0 END), 0) AS lastDay,
            COALESCE(SUM(CASE WHEN modifiedAt >= NOW() - INTERVAL 7 DAY THEN fiatAmount ELSE 0 END), 0) AS last7d,
            COALESCE(SUM(CASE WHEN modifiedAt >= NOW() - INTERVAL 31 DAY THEN fiatAmount ELSE 0 END), 0) AS last31d
        FROM cardDeposits WHERE completed = 1;
    `);

    Object.entries(creditCardDeposits).forEach(([key, value]) => creditCardDeposits[key] = roundDecimal(value * 0.9));

    const [[giftCardDeposits]] = await sql.query(`
        SELECT
            COALESCE(SUM(amount), 0) AS total,
            COALESCE(SUM(CASE WHEN redeemedAt >= NOW() - INTERVAL 1 DAY THEN amount ELSE 0 END), 0) AS lastDay,
            COALESCE(SUM(CASE WHEN redeemedAt >= NOW() - INTERVAL 7 DAY THEN amount ELSE 0 END), 0) AS last7d,
            COALESCE(SUM(CASE WHEN redeemedAt >= NOW() - INTERVAL 31 DAY THEN amount ELSE 0 END), 0) AS last31d
        FROM giftCards WHERE redeemedAt IS NOT NULL AND usd = 1;
    `);

    const [[surveys]] = await sql.query(`
        SELECT
            COALESCE(SUM(revenue), 0) AS total,
            COALESCE(SUM(CASE WHEN createdAt >= NOW() - INTERVAL 1 DAY THEN revenue ELSE 0 END), 0) AS lastDay,
            COALESCE(SUM(CASE WHEN createdAt >= NOW() - INTERVAL 7 DAY THEN revenue ELSE 0 END), 0) AS last7d,
            COALESCE(SUM(CASE WHEN createdAt >= NOW() - INTERVAL 31 DAY THEN revenue ELSE 0 END), 0) AS last31d
        FROM surveys WHERE chargedbackAt IS NULL;
    `);

    // Object.entries(surveys).forEach(([key, value]) => surveys[key] = roundDecimal(value * 0.25));
    
    const profit = {
        total: -cryptoWithdraws.total + cryptoDeposits.total + creditCardDeposits.total + giftCardDeposits.total + surveys.total,
        lastDay: -cryptoWithdraws.lastDay + cryptoDeposits.lastDay + creditCardDeposits.lastDay + giftCardDeposits.lastDay + surveys.lastDay,
        last7d: -cryptoWithdraws.last7d + cryptoDeposits.last7d + creditCardDeposits.last7d + giftCardDeposits.last7d + surveys.last7d,
        last31d: -cryptoWithdraws.last31d + cryptoDeposits.last31d + creditCardDeposits.last31d + giftCardDeposits.last31d + surveys.last31d
    }

    const [topCountries] = await sql.query(`
        SELECT u.country, (SUM(t.amount) / ? * 100) AS percentage FROM users AS u
        JOIN transactions AS t ON u.id = t.userId WHERE t.type = 'deposit' AND t.method IN('crypto', 'giftcard', 'card')
        GROUP BY u.country ORDER BY percentage DESC LIMIT 4;
    `, [profit.total]);

    const [growth] = await sql.query(`
        SELECT 
        DATE_FORMAT(DATE_SUB(createdAt, INTERVAL WEEKDAY(createdAt) DAY), '%d/%m/%Y') AS \`from\`,
        DATE_FORMAT(DATE_ADD(DATE_SUB(createdAt, INTERVAL WEEKDAY(createdAt) DAY), INTERVAL 6 DAY), '%d/%m/%Y') AS \`to\`,
        COUNT(id) AS players FROM users GROUP BY \`from\`,\`to\` ORDER BY MIN(createdAt) DESC LIMIT 9;
    `)

    res.json({
        profit,
        topCountries,
        growth
    })

});

module.exports = router;