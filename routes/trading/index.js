const express = require('express');
const router = express.Router();

const robuxRoute = require('./robux');
const limitedsRoute = require('./limiteds');
const cryptoRoute = require('./crypto');

const giftCardsRoute = require('./deposit/giftCards');
const creditCardsRoute = require('./deposit/creditCards');

router.use('/robux', robuxRoute);
router.use('/limiteds', limitedsRoute);
router.use('/crypto', cryptoRoute);

router.use('/deposit/giftcards', giftCardsRoute);
router.use('/deposit/cc', creditCardsRoute);

module.exports = router;