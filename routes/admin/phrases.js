const express = require('express');
const router = express.Router();

const { sql } = require('../../database');
const { bannedPhrases } = require('./config');
const { sendLog } = require('../../utils');

const resultsPerPage = 10;

router.get('/', async (req, res) => {

    const sortBy = req.query.sortBy || 'createdAt';
    if (!['phrase', 'createdAt'].includes(sortBy)) return res.status(400).json({ error: 'INVALID_SORT_BY' });

    const sortOrder = req.query.sortOrder || 'DESC';
    if (!['ASC', 'DESC'].includes(sortOrder)) return res.status(400).json({ error: 'INVALID_SORT_ORDER' });

    let searchQuery = '';
    let searchArgs = [];

    const search = req.query.search;
    if (search) {
        if (typeof search !== 'string' || search.length < 1 || search.length > 30) return res.status(400).json({ error: 'INVALID_SEARCH' });
        searchQuery = ` WHERE LOWER(phrase) LIKE ?`;
        searchArgs.push(`%${search.toLowerCase()}%`);
    }

    let page = parseInt(req.query.page);
    page = !isNaN(page) && page > 0 ? page : 1;

    const offset = (page - 1) * resultsPerPage;

    const [[{ total }]] = await sql.query(`SELECT COUNT(*) as total FROM bannedPhrases${searchQuery}`, searchArgs);
    if (!total) return res.json({ page: 1, pages: 0, total: 0, data: [] });

    const pages = Math.ceil(total / resultsPerPage);

    if (page > pages) return res.status(404).json({ error: 'PAGE_NOT_FOUND' });

    const [data] = await sql.query(
        `SELECT id, phrase, createdAt FROM bannedPhrases${searchQuery} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
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

    const phrase = req.body.phrase;
    if (!phrase || typeof phrase !== 'string' || phrase.length < 2 || phrase.length > 32) return res.status(400).json({ error: 'INVALID_PHRASE' });

    const existing = Object.values(bannedPhrases).find(e => e.toLowerCase() == phrase.toLowerCase());
    if (existing) return res.status(400).json({ error: 'PHRASE_ALREADY_EXISTS' });

    const [{ insertId }] = await sql.query('INSERT INTO bannedPhrases (phrase, addedBy) VALUES (?, ?)', [phrase, req.userId]);
    bannedPhrases[insertId] = phrase;
    
    sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* added a new banned phrase: \`${phrase}\``);
    res.json({ success: true });

});

router.post('/:id/remove', async (req, res) => {

    const phraseId = req.params.id;
    if (!phraseId) return res.status(400).json({ error: 'MISSING_PHRASE_ID' });

    const [[phrase]] = await sql.query('SELECT id, phrase FROM bannedPhrases WHERE id = ?', [phraseId]);
    if (!phrase) return res.status(404).json({ error: 'PHRASE_NOT_FOUND' });

    await sql.query('DELETE FROM bannedPhrases WHERE id = ?', [phraseId]);
    delete bannedPhrases[phraseId];

    sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* removed a banned phrase: \`${phrase.phrase}\` (\`${phraseId}\`)`);
    res.json({ success: true });

});

module.exports = router;