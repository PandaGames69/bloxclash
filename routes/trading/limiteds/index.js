const express = require('express');
const router = express.Router();
const { marketplaceListings, adurite } = require('./functions');

router.get('/', (req, res) => {
    res.json(Object.values(marketplaceListings));
});

router.get('/adurite', (req, res) => {
    res.json(Object.values(adurite.listings));
})

const buyRoute = require('./buy');
const sellRoute = require('./sell');

router.use('/buy', buyRoute);
router.use('/sell', sellRoute);

module.exports = router;