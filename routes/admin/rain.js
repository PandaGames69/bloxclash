const express = require('express');
const router = express.Router();

const { sql, doTransaction } = require('../../database');
const { rains } = require('../../socketio/rain');
const io = require('../../socketio/server');
// const { roundDecimal } = require('../../utils');
const { sendLog } = require('../../utils');

const resultsPerPage = 10;

router.get('/', async (req, res) => {

    const rain = rains.system;

    const sortBy = req.query.sortBy || 'amount';
    if (!['amount', 'createdAt'].includes(sortBy)) return res.status(400).json({ error: 'INVALID_SORT_BY' });

    const sortOrder = req.query.sortOrder || 'DESC';
    if (!['ASC', 'DESC'].includes(sortOrder)) return res.status(400).json({ error: 'INVALID_SORT_ORDER' });

    let searchQuery = 'WHERE rainId = ?';
    let searchArgs = [rain.id];

    const search = req.query.search;
    if (search) {
        if (typeof search !== 'string' || search.length < 1 || search.length > 30) return res.status(400).json({ error: 'INVALID_SEARCH' });
        searchQuery += ` AND LOWER(username) LIKE ?`;
        searchArgs.push(`%${search.toLowerCase()}%`);
    }

    let page = parseInt(req.query.page);
    page = !isNaN(page) && page > 0 ? page : 1;

    const offset = (page - 1) * resultsPerPage;

    const [[{ total }]] = await sql.query(`SELECT COUNT(*) as total FROM rainTips JOIN users ON rainTips.userId = users.id ${searchQuery}`, searchArgs);
    if (!total) return res.json({ page: 1, pages: 0, total: 0, data: [] });

    const pages = Math.ceil(total / resultsPerPage);

    if (page > pages) return res.status(404).json({ error: 'PAGE_NOT_FOUND' });

    const [data] = await sql.query(
        `SELECT users.id, users.username, users.role, users.xp, rainTips.amount, rainTips.createdAt FROM rainTips JOIN users ON rainTips.userId = users.id ${searchQuery} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
        searchArgs.concat([resultsPerPage, offset])
    );
    
    res.json({
        page,
        pages,
        total,
        data
    });

});

router.post('/add', async (req, res) => {

    const amount = parseFloat(req.body.amount);
    if (!amount || isNaN(amount) || amount < 0.01 || amount > 1000000) return res.status(400).json({ error: 'INVALID_AMOUNT' });
    setRain(req, res, amount)

});

router.post('/substract', async (req, res) => {

    const amount = parseFloat(req.body.amount);
    if (!amount || isNaN(amount) || amount < 0.01 || amount > 1000000) return res.status(400).json({ error: 'INVALID_AMOUNT' });
    setRain(req, res, -amount)

});

async function setRain(req, res, amount) {

    try {
        
        await doTransaction(async (connection, commit, rollback) => {
            
            const rain = rains.system;

            const [[currentRain]] = await connection.query('SELECT id, amount, host, createdAt, amount FROM rains WHERE id = ? FOR UPDATE', [rain.id]);
            if (currentRain.endedAt) return res.status(400).json({ error: 'RAIN_ENDED' });
            if (currentRain.amount + amount < 0) return res.status(400).json({ error: 'OUT_OF_BOUNDS' });

            await connection.query('UPDATE rains SET amount = amount + ? WHERE id = ?', [amount, rain.id]);            
            await commit();

            rain.amount += amount;
            io.emit('rain:pot', rain.amount);
        
            res.json({ success: true });
            sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* ${amount > 0 ? 'added' : 'substracted'} :robux: R$${Math.abs(amount)} ${amount > 0 ? 'to' : 'from'} the rain pot.`);
        
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'SERVER_ERROR' });
    }

}

module.exports = router;