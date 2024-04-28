const express = require('express');
const router = express.Router();

const { isAuthed } = require('../../auth/functions');
const { slots, hacksawTokens } = require('./functions');
const { enabledFeatures } = require('../../admin/config');
const axios = require('axios');
const { sql } = require('../../../database');
const crypto = require('crypto');

const hacksawRoute = require('./providers/hacksaw');
router.use('/hacksaw', hacksawRoute);

const providers = {
    'hacksaw': {
        name: 'Hacksaw Gaming',
        slug: 'hacksaw',
        img: '/public/slots/providers/hacksaw.png'
    }
};

router.get('/', async (req, res) => {

    let sortBy = req.query.sortBy || 'popularity';
    if (!['name', 'rtp', 'popularity'].includes(sortBy)) return res.status(400).json({ error: 'INVALID_SORT_BY' });

    let sortOrder = req.query.sortOrder || 'DESC';
    if (!['ASC', 'DESC'].includes(sortOrder)) return res.status(400).json({ error: 'INVALID_SORT_ORDER' });

    if (sortBy == 'popularity') {
        sortBy = 'id';
        sortOrder = sortOrder == 'ASC' ? 'DESC' : 'ASC';
    }

    const limit = parseInt(req.query.limit) || 50;
    if (isNaN(limit) || limit < 1 || limit > 100) return res.status(400).json({ error: 'INVALID_LIMIT' });

    const offset = parseInt(req.query.offset) || 0;
    if (isNaN(offset) || offset < 0) return res.status(400).json({ error: 'INVALID_OFFSET' });

    let searchQuery = '';
    let searchArgs = [];

    const search = req.query.search;
    if (search) {
        if (typeof search !== 'string' || search.length < 1 || search.length > 30) return res.status(400).json({ error: 'INVALID_SEARCH' });
        searchQuery = ` WHERE LOWER(name) LIKE ?`;
        searchArgs.push(`%${search.toLowerCase()}%`);
    }
    
    const provider = req.query.provider;
    if (provider) {
        if (!providers[provider]) return res.status(400).json({ error: 'INVALID_PROVIDER' });
        searchQuery += ` ${searchQuery ? 'AND' : 'WHERE'} provider = ?`;
        searchArgs.push(provider);
    }

    const [[{ total }]] = await sql.query(`SELECT COUNT(*) as total FROM slots${searchQuery}`, searchArgs);
    if (!total) return res.json({ limit, offset, total: 0, data: [] });

    const [data] = await sql.query(
        `SELECT slug, img FROM slots${searchQuery} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
        searchArgs.concat([limit, offset])
    );
    
    res.json({
        limit,
        offset,
        total,
        data
    });

});

router.get('/providers', (req, res) => {
    res.json(Object.values(providers));
});

router.get('/featured', (req, res) => {
    res.json(Object.values(slots).slice(0, 7).map(e => mapSlot(e)));
})

router.get('/:slug', (req, res) => {

    const slug = req.params.slug;
    const slot = slots[slug];

    if (!slot) return res.status(400).json({ error: 'INVALID_SLOT' });
    if (!slot.enabled) return res.status(400).json({ error: 'DISABLED' });

    const featured = [];

    const slotsArray = Object.values(slots);

    for (const featuredSlot of slotsArray) {
        if (featuredSlot.id != slot.id) featured.push(mapSlot(featuredSlot));
        if (featured.length >= 10) break;
    }

    res.json({
        ...mapSlot(slot),
        featured
    });

});

function mapSlot(e, extended = true) {

    let slot = {
        slug: e.slug,
        img: e.img
    }
    
    if (extended) {
        slot.name = e.name;
        slot.providerName = providers[e.provider].name || e.provider;
        slot.rtp = e.rtp;
    }
    
    return slot;

}

router.post('/embed/:slug', isAuthed, async (req, res) => {

    if (!enabledFeatures.slots) return res.status(400).json({ error: 'DISABLED' });

    const slug = req.params.slug;
    const slot = slots[slug];

    if (!slot) return res.status(400).json({ error: 'INVALID_SLOT' });
    if (!slot.enabled) return res.status(400).json({ error: 'DISABLED' });

    if (slot.provider == 'hacksaw') {

        if (!slot.version || !slot.versionUpdatedAt || slot.versionUpdatedAt.valueOf() < Date.now() - 60000 * 10) {

            const now = new Date();
            const { data } = await axios(`https://static-live.hacksawgaming.com/${slot.providerGameId}/version.json?${now.valueOf()}`);

            if (!data.version) {
                console.error(`Couldn't fetch version for ${slot.name} (${slot.slug})`, data);
                return res.status(400).json({ error: 'UNKNOWN_ERROR' });
            }

            slot.version = data.version;
            slot.versionUpdatedAt = now;

            await sql.query(`UPDATE slots SET version = ?, versionUpdatedAt = ? WHERE id = ?`, [slot.version, slot.versionUpdatedAt, slot.id]);

        }

        const token = crypto.randomUUID();
        hacksawTokens[token] = req.userId;

        const params = new URLSearchParams({
            language: 'en',
            channel: 'desktop',
            gameid: slot.providerGameId,
            mode: 1,
            token,
            lobbyurl: process.env.FRONTEND_URL,
            currency: 'RBX',
            partner: 'bloxclash',
            env: `${process.env.BASE_URL}/slots/${slot.provider}`
        }).toString();

        res.json({
            url: `https://static-live.hacksawgaming.com/${slot.providerGameId}/${slot.version}/index.html?${params}`
        });

    } else {
        return res.status(400).json({ error: 'INVALID_PROVIDER' });
    }

});

module.exports = router;