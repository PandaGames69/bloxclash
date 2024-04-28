const express = require('express');
const router = express.Router();

const { sql } = require('../../database');
const { enabledFeatures } = require('./config');
const { sendLog } = require('../../utils');

router.get('/', (req, res) => {
    res.json(enabledFeatures);
});

router.post('/:id', async (req, res) => {

    const feature = req.params.id;
    if (enabledFeatures[feature] === undefined) return res.status(400).json({ error: 'INVALID_FEATURE' });

    const enable = req.body.enable;
    if (typeof enable !== 'boolean') return res.status(400).json({ error: 'INVALID_ENABLE' });

    enabledFeatures[feature] = enable;
    await sql.query('UPDATE features SET enabled = ? WHERE id = ?', [enable, feature]);

    sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* ${enable ? 'enabled' : 'disabled'} feature \`${feature}\`.`);
    res.json({ success: true });

});

module.exports = router;