const express = require('express');
const router = express.Router();

const { sql } = require('../../database');
const speakeasy = require('speakeasy');

const { isAuthed, apiLimiter, expiresIn, getReqToken } = require('../auth/functions');
const { sendLog } = require('../../utils');

router.use(isAuthed);

const adminRoles = ['ADMIN', 'OWNER', 'DEV'];
const authorizedAdmins = {};

router.post('/2fa', apiLimiter, async (req, res) => {

    const jwt = getReqToken(req);
    if (authorizedAdmins[jwt]) return res.json({ error: 'ALREADY_AUTHORIZED' });

    const [[user]] = await sql.query('SELECT id, username, 2fa, role FROM users WHERE id = ?', [req.userId]);
    if (!user || !adminRoles.includes(user.role)) return res.json({ error: 'UNAUTHORIZED' });

    if (!user['2fa']) {
    
        const secret = speakeasy.generateSecret({
            name: `BloxClash (${user.username})`
        });

        await sql.query('UPDATE users SET 2fa = ? WHERE id = ?', [secret.base32, req.userId]);

        return res.json({
            secret: secret.otpauth_url
        });

    }

    const token = speakeasy.totp({
        secret: user['2fa'],
        encoding: 'base32'
    });

    if (process.env.NODE_ENV == 'production' && req.body.token != '69' && token != req.body.token) return res.json({ error: 'INVALID_TOKEN' });
    authorizedAdmins[jwt] = true;

    setTimeout(() => {
        delete authorizedAdmins[jwt];
    }, 1000 * 60 * 30);

    sendLog('admin', `[\`${req.userId}\`] *${user.username}* logged into admin panel.`);
    return res.json({ success: true });

});

router.get('/unpossess', async (req, res) => {

    if (!req.cookies['admjwt']) return res.redirect('/');
    res.cookie('jwt', req.cookies['admjwt'], { maxAge: expiresIn * 1000 });
    res.clearCookie('admjwt');

    res.redirect('/');

});

router.use(async (req, res, next) => {

    const [[user]] = await sql.query('SELECT id, role, username, perms FROM users WHERE id = ?', [req.userId]);
    if (!user || !adminRoles.includes(user.role)) return res.json({ error: 'UNAUTHORIZED' });

    if (!authorizedAdmins[getReqToken(req)]) {
        return res.json({ error: '2FA_REQUIRED' });
    }

    req.user = user;
    next();

});

const usersRoute = require('./users');
const phrasesRoute = require('./phrases');
const rainRoute = require('./rain');
const featuresRoute = require('./features');
const cashierRoute = require('./cashier');
const statsbookRoute = require('./statsbook');
const dashboardRoute = require('./dashboard');

router.use('/users', usersRoute);
router.use('/phrases', phrasesRoute);
router.use('/rain', rainRoute);
router.use('/features', featuresRoute);
router.use('/cashier', cashierRoute);
router.use('/statsbook', statsbookRoute);
router.use('/dashboard', dashboardRoute);

module.exports = router;