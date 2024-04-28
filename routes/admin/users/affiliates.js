const express = require('express');
const router = express.Router();

const { sql, doTransaction } = require('../../../database');
const { roundDecimal, sendLog } = require('../../../utils');

const resultsPerPage = 10;

router.get('/', async (req, res) => {

    const sortBy = req.query.sortBy || 'affiliatedUsersCount';
    if (!['balance', 'xp', 'totalWagered', 'affiliatedUsersCount'].includes(sortBy)) return res.status(400).json({ error: 'INVALID_SORT_BY' });

    const sortOrder = req.query.sortOrder || 'DESC';
    if (!['ASC', 'DESC'].includes(sortOrder)) return res.status(400).json({ error: 'INVALID_SORT_ORDER' });

    let searchQuery = '';
    let searchArgs = [];

    const search = req.query.search;
    if (search) {
        if (typeof search !== 'string' || search.length < 1 || search.length > 30) return res.status(400).json({ error: 'INVALID_SEARCH' });
        searchQuery = ` WHERE LOWER(username) LIKE ?`;
        searchArgs.push(`%${search.toLowerCase()}%`);
    }

    let page = parseInt(req.query.page);
    page = !isNaN(page) && page > 0 ? page : 1;

    const offset = (page - 1) * resultsPerPage;

    const [[{ total }]] = await sql.query(`SELECT COUNT(*) as total FROM users${searchQuery}`, searchArgs);
    if (!total) return res.json({ page: 1, pages: 0, total: 0, data: [] });

    const pages = Math.ceil(total / resultsPerPage);

    if (page > pages) return res.status(404).json({ error: 'PAGE_NOT_FOUND' });

    const [data] = await sql.query(
        `
        SELECT
            users.id,
            users.username,
            users.role,
            users.balance,
            users.affiliateCode,
            users.xp,
            COUNT(DISTINCT affiliates.userId) AS affiliatedUsersCount,
            COALESCE(SUM(CASE WHEN bets.createdAt >= affiliates.createdAt THEN bets.amount ELSE 0 END), 0) AS affiliatedUsersWageredCount
        FROM
            users
        LEFT JOIN
            affiliates ON users.id = affiliates.affiliateId
        LEFT JOIN
            bets ON affiliates.userId = bets.userId AND bets.createdAt >= affiliates.createdAt AND bets.completed = 1
        ${searchQuery} GROUP BY
            users.id ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?;
       `,
        searchArgs.concat([resultsPerPage, offset])
    );
    
    res.json({
        page,
        pages,
        total,
        data
    });

});

router.get('/:id', async (req, res) => {

    const userId = req.params.id;
    
    const [[user]] = await sql.query(
        `
        SELECT
        users.id,
        users.username,
        users.xp,
        users.role,
        users.affiliateCode,
        users.affiliateCodeLock,
        users.affiliateEarningsOffset,
        (SELECT COUNT(DISTINCT userId) FROM affiliates WHERE affiliates.affiliateId = users.id) AS affiliatedUsersCount,
        (SELECT COALESCE(SUM(transactions.amount), 0) FROM affiliates JOIN transactions ON affiliates.userId = transactions.userId WHERE affiliates.affiliateId = users.id AND transactions.createdAt >= affiliates.createdAt AND transactions.type = 'deposit') AS affiliatedUsersDepositedCount,
        (SELECT COALESCE(SUM(transactions.amount), 0) FROM affiliates JOIN transactions ON affiliates.userId = transactions.userId WHERE affiliates.affiliateId = users.id AND transactions.createdAt >= affiliates.createdAt AND transactions.type = 'withdraw') AS affiliatedUsersWithdrawedCount,
        (
          SELECT COALESCE(SUM(bets.amount), 0) 
          FROM affiliates 
          JOIN bets ON affiliates.userId = bets.userId 
          WHERE affiliates.affiliateId = users.id AND bets.createdAt >= affiliates.createdAt AND bets.completed = 1
        ) AS affiliatedUsersWageredCount,
        (
          SELECT COALESCE(SUM(bets.edge), 0) 
          FROM affiliates 
          JOIN bets ON affiliates.userId = bets.userId 
          WHERE affiliates.affiliateId = users.id AND bets.createdAt >= COALESCE(
            (SELECT MAX(createdAt) FROM affiliateClaims WHERE userId = users.id), affiliates.createdAt
          )
        ) AS affiliatedUsersEdgeCountSinceLastClaim
        FROM
            users
        WHERE
            users.id = ?;
        `,
        [userId]
    );

    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    
    user.pendingAffiliateEarnings = roundDecimal((user.affiliatedUsersEdgeCountSinceLastClaim * 0.1) + user.affiliateEarningsOffset);

    delete user.affiliateEarningsOffset;
    delete user.affiliatedUsersEdgeCountSinceLastClaim;

    res.json(user);

});

router.post('/:id/lock', async (req, res) => {

    const userId = req.params.id;
    const lock = req.body.lock;
    if (typeof lock !== 'boolean') return res.status(400).json({ error: 'INVALID_LOCK' });

    await sql.query('UPDATE users SET affiliateCodeLock = ? WHERE id = ?', [lock, userId]);

    sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* affiliate code ${lock ? 'locked' : 'unlocked'} user \`${userId}\`.`)
    res.json({ success: true });

});

router.post('/:id/clear', async (req, res) => {

    const userId = req.params.id;
    await sql.query('DELETE FROM affiliates WHERE affiliateId = ?', [userId]);

    sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* cleared affiliate data for user \`${userId}\`.`);
    res.json({ success: true });

});

router.post('/:id/removeCode', async (req, res) => {

    const userId = req.params.id;
    await sql.query('UPDATE users SET affiliateCode = NULL WHERE id = ?', [userId]);

    sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* removed affiliate code for user \`${userId}\`.`);
    res.json({ success: true });

});

router.post('/:id/setCode', async (req, res) => {

    const userId = req.params.id;
    const code = req.body.code?.toLowerCase().trim();
    if (!code || typeof code != 'string' || code.length < 2 || code.length > 20 || !onlyLettersAndNumbers(code)) return res.status(400).json({ error: 'INVALID_CODE' });

    try {
        
        await doTransaction(async (connection, commit) => {
            const [[affiliate]] = await connection.query('SELECT id, username FROM users WHERE affiliateCode = ? FOR UPDATE', [code]);
            if (affiliate) return res.status(400).json({ error: 'CODE_ALREADY_EXISTS' });
        
            await connection.query('UPDATE users SET affiliateCode = ? WHERE id = ?', [code, userId]);
            await commit();
    
            sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* set affiliate code \`${code}\` for user \`${userId}\`.`);
            res.json({ success: true });
        });

    } catch(e) {
        console.error(e);
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }


});

function onlyLettersAndNumbers(str) {
    return /^[A-Za-z0-9]*$/.test(str);
}

router.post('/:id/earnings', async (req, res) => {

    const userId = req.params.id;
    const earnings = req.body.earnings;

    if (typeof earnings !== 'number' || earnings < 0) return res.status(400).json({ error: 'INVALID_EARNINGS' });

    try {

        await doTransaction(async (connection, commit) => {

            const [[user]] = await sql.query(
                `
                SELECT
                users.id,
                users.affiliateEarningsOffset,
                (
                  SELECT COALESCE(SUM(bets.edge), 0) 
                  FROM affiliates 
                  JOIN bets ON affiliates.userId = bets.userId 
                  WHERE affiliates.affiliateId = users.id AND bets.createdAt >= COALESCE(
                    (SELECT MAX(createdAt) FROM affiliateClaims WHERE userId = users.id), affiliates.createdAt
                  )
                ) AS affiliatedUsersEdgeCountSinceLastClaim
                FROM
                    users
                WHERE
                    users.id = ?;
                `,
                [userId]
            );
        
            const affiliateEarnings = roundDecimal((user.affiliatedUsersEdgeCountSinceLastClaim * 0.1) + user.affiliateEarningsOffset);
            const offset = earnings - affiliateEarnings;
        
            await connection.query('UPDATE users SET affiliateEarningsOffset = affiliateEarningsOffset + ? WHERE id = ?', [offset, userId]);
            await commit();

        });

        sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* set affiliate earnings for user \`${userId}\` to :robux:\`R$${earnings}\`.`);
        res.json({ success: true });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'INTERNAL_ERROR' });        
    }

});


module.exports = router;