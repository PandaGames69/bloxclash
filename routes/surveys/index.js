const express = require('express');
const router = express.Router();
const { enabledFeatures } = require('../admin/config');

const walls = [
    {
        id: 'lootably',
        name: 'Lootably',
        embed: `https://wall.lootably.com/?placementID=${process.env.LOOTABLY_PLACEMENT_ID}&sid={userId}`
    },
    {
        id: 'cpx',
        name: 'CPX Research',
        embed: `https://offers.cpx-research.com/index.php?app_id=${process.env.CPX_APP_ID}&ext_user_id={userId}`
    }
];

walls.forEach(e => {
    const lootablyRoute = require(`./walls/${e.id}`);
    router.use(`/${e.id}`, lootablyRoute);
});

router.get('/walls', (req, res) => {

    if (!enabledFeatures.surveys) return res.status(400).json({ error: 'DISABLED' });
    res.json(walls);

});

module.exports = router;