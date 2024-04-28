const express = require('express');
const router = express.Router();

const { leaderboards } = require('./functions')

router.get('/:type', async (req, res) => {

    const type = req.params.type;
    if (!leaderboards[type]) return res.status(400).json({ error: 'INVALID_TYPE' });

    const leaderboard = leaderboards[type];
    if (!leaderboard || !leaderboard.cache) return res.status(404).json({ error: 'NOT_FOUND' });

    leaderboard.cache.endsIn = leaderboard.cache.endsAt - Date.now();
    res.json(leaderboard.cache);

});

module.exports = router;