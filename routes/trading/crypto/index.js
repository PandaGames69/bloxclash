const express = require('express');
const router = express.Router();

const depositRoute = require('./deposit');
const withdrawRoute = require('./withdraw');

router.use('/deposit', depositRoute);
router.use('/withdraw', withdrawRoute);

module.exports = router;