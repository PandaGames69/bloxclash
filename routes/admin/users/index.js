const express = require('express');
const router = express.Router();

const { body, validationResult } = require('express-validator');
const { bannedUsers, sponsorLockedUsers } = require('../config');
const { roundDecimal, sendLog } = require('../../../utils');
const { generateJwtToken, expiresIn, getReqToken } = require('../../auth/functions');

router.use('/affiliates', require('./affiliates'));
const { sql, doTransaction } = require('../../../database');
const io = require('../../../socketio/server');

const resultsPerPage = 10;

router.get('/', async (req, res) => {

    const sortBy = req.query.sortBy || 'balance';
    if (!['username', 'xp', 'balance', 'perms'].includes(sortBy)) return res.status(400).json({ error: 'INVALID_SORT_BY' });

    const sortOrder = req.query.sortOrder || 'DESC';
    if (!['ASC', 'DESC'].includes(sortOrder)) return res.status(400).json({ error: 'INVALID_SORT_ORDER' });

    let searchQuery = '';
    let searchArgs = [];

    const search = req.query.search;
    if (search) {
        if (typeof search !== 'string' || search.length < 1 || search.length > 30) return res.status(400).json({ error: 'INVALID_SEARCH' });
        searchQuery = ` WHERE LOWER(username) LIKE ?`;
        searchArgs.push(`%${search.toLowerCase()}%`);
    }

    let page = parseInt(req.query.page);
    page = !isNaN(page) && page > 0 ? page : 1;

    const offset = (page - 1) * resultsPerPage;

    const [[{ total }]] = await sql.query(`SELECT COUNT(*) as total FROM users${searchQuery}`, searchArgs);
    if (!total) return res.json({ page: 1, pages: 0, total: 0, data: [] });

    const pages = Math.ceil(total / resultsPerPage);

    if (page > pages) return res.status(404).json({ error: 'PAGE_NOT_FOUND' });

    const [data] = await sql.query(
        `SELECT id, username, role, balance, xp FROM users${searchQuery} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
        searchArgs.concat([resultsPerPage, offset])
    );
    
    res.json({
        page,
        pages,
        total,
        data
    });

});

router.get('/:id', async (req, res) => {

    const userId = req.params.id;
    
    const [[user]] = await sql.query(
        `SELECT id, username, xp, role, balance, banned, tipBan, leaderboardBan, rainBan, accountLock, sponsorLock, maxPerTip, maxTipPerUser, tipAllowance, rainTipAllowance, cryptoAllowance, mutedUntil, discordId FROM users
        LEFT JOIN discordAuths ON discordAuths.userId = users.id
        WHERE id = ?`,
        [userId]
    );

    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const [[wagered]] = await sql.query('SELECT SUM(amount) AS wagered FROM bets WHERE userId = ? AND completed = 1', [userId]);
    user.wagered = wagered.wagered || 0;

    const [[result]] = await sql.query(`
        SELECT 
        SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as deposits,
        SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) as withdraws
        FROM transactions 
        WHERE userId = ? AND type IN ('deposit', 'withdraw')
    `, [userId]);
  
    user.deposits = result.deposits || 0;
    user.withdraws = result.withdraws || 0;
    
    if (user.mutedUntil) {
        user.muteSeconds = Math.round((user.mutedUntil - Date.now()) / 1000);
        if (user.muteSeconds < 0) {
            user.muteSeconds = null;
        }
    } else {
        user.muteSeconds = null;
    }

    delete user.mutedUntil;

    res.json(user);

});

router.get('/:id/possess', async (req, res) => {

    const userId = req.params.id;
    
    const [[user]] = await sql.query(`SELECT id, perms FROM users WHERE id = ? OR LOWER(username) = ?`, [userId, userId.toLowerCase()]);
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    if (user.perms >= req.user.perms) return res.status(400).json({ error: 'CANNOT_POSSESS_HIGHER_USER' });

    const jwt = generateJwtToken(user.id);

    res.cookie('jwt', jwt, { maxAge: expiresIn * 1000 });
    res.cookie('admjwt', getReqToken(req), { maxAge: expiresIn * 1000 });

    res.redirect('/');
    sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* possesed \`${userId}\`.`)

});

const defaultRolePermissions = {
    USER: 0,
    MOD: 1,
    DEV: 2,
    ADMIN: 2,
    OWNER: 3
}

function nullableNumber(value) {
    return value === null || (typeof value === 'number' && value >= 0 && value <= 100000000);
}

router.post('/:id', [
    body('banned').optional().isBoolean().withMessage('BANNED_NOT_BOOLEAN'),
    body('rainBan').optional().isBoolean().withMessage('RAINBAN_NOT_BOOLEAN'),
    body('tipBan').optional().isBoolean().withMessage('TIPBAN_NOT_BOOLEAN'),
    body('accountLock').optional().isBoolean().withMessage('ACCOUNTLOCK_NOT_BOOLEAN'),
    body('sponsorLock').optional().isBoolean().withMessage('SPONSORLOCK_NOT_BOOLEAN'),
    body('leaderboardBan').optional().isBoolean().withMessage('LEADERBOARDBAN_NOT_BOOLEAN'),
    body('muteSeconds').optional().custom(nullableNumber).withMessage('MUTESECONDS_INVALID'),
    body('maxPerTip').optional().custom(nullableNumber).withMessage('MAXPERTIP_INVALID'),
    body('maxTipPerUser').optional().custom(nullableNumber).withMessage('MAXTIPPERUSER_INVALID'),
    body('rainTipAllowance').optional().custom(nullableNumber).withMessage('RAINTIPALLOWANCE_INVALID'),
    body('tipAllowance').optional().custom(nullableNumber).withMessage('TIPALLOWANCE_INVALID'),
    body('cryptoAllowance').optional().custom(nullableNumber).withMessage('CRYPTOALLOWANCE_INVALID'),
    body('balance').optional().isNumeric().withMessage('BALANCE_INVALID').isFloat({ min: 0.0, max: 10000000 }).withMessage('BALANCE_INVALID'),
    body('xp').optional().isNumeric().withMessage('XP_INVALID').isFloat({ min: 0.0, max: 100000000 }).withMessage('XP_INVALID'),
    body('unlinkDiscord').optional().isBoolean().withMessage('UNLINKDISCORD_NOT_BOOLEAN'),
    async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array()[0].msg });
        }

        if (typeof req.body['muteSeconds'] === 'number') {
            req.body['mutedUntil'] = new Date(Date.now() + req.body['muteSeconds'] * 1000);
        } else if (req.body['muteSeconds'] === null) {
            req.body['mutedUntil'] = null;
        }

        if (req.body.perms !== undefined) {
            return res.status(400).json({ error: 'PERMS_NOT_ALLOWED' });
        }

        if (req.body.role !== undefined) {
            
            const newPerm = defaultRolePermissions[req.body.role];
            if (newPerm === undefined) {
                return res.status(400).json({ error: 'INVALID_ROLE' });
            }
            if (newPerm > req.user.perms) {
                return res.status(400).json({ error: 'CANNOT_SET_HIGHER_ROLE' });
            }
            req.body.perms = newPerm;
        }

        try {

            await doTransaction(async (connection, commit) => {

                const userId = req.params.id;
                const [[user]] = await connection.query('SELECT id, perms, role, username, balance FROM users WHERE id = ? FOR UPDATE', [userId]);
                if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
        
                if (user.id != req.userId && (user.role == 'BOT' || (req.user.perms < 4 && user.perms >= req.user.perms))) return res.status(400).json({ error: 'CANNOT_EDIT_USER' });
                if (req.body.banned && user.id == req.userId) return res.status(400).json({ error: 'CANNOT_BAN_SELF' });
    
                const allowedFields = ['banned', 'rainBan', 'leaderboardBan', 'tipBan', 'accountLock', 'balance', 'sponsorLock', 'mutedUntil', 'maxPerTip', 'maxTipPerUser', 'rainTipAllowance', 'tipAllowance', 'cryptoAllowance', 'xp', 'role', 'perms'];
        
                const updatePairs = [];
                const values = [];
        
                for (let field of allowedFields) {
                    if (req.body[field] !== undefined) {
                        updatePairs.push(`${field} = ?`);
                        values.push(req.body[field]);
    
                        if (field == 'balance') {
                            const diff = roundDecimal(req.body[field] - user.balance);
                            if (diff) {
                                await connection.query('INSERT INTO transactions (userId, amount, type, method, methodId) VALUES (?, ?, ?, ?, ?)', [userId, Math.abs(diff), diff > 0 ? 'in' : 'out', 'admin', null]);
                                io.to(userId).emit('balance', 'set', req.body[field]);
                            }
                        }
    
                    }
                }
        
                if (req.body.unlinkDiscord) {
                    await connection.query('DELETE FROM discordAuths WHERE userId = ?', [user.id]);
                } else if (!updatePairs.length) {
                    return res.status(400).json({ error: 'NO_VALID_FIELDS' });
                } else {
                    values.push(userId);
                    const updateQuery = `UPDATE users SET ${updatePairs.join(', ')} WHERE id = ?`;
                    await connection.query(updateQuery, values);
                }
    
                if (req.body.banned !== undefined) {
                    if (req.body.banned) {
                        bannedUsers.add(userId);
                    } else {
                        bannedUsers.delete(userId);
                    }
                }
    
                if (req.body.sponsorLock !== undefined) {
                    if (req.body.sponsorLock) {
                        await connection.query('DELETE FROM affiliates WHERE userId = ?', [userId]);
                        sponsorLockedUsers.add(userId);
                    } else {
                        sponsorLockedUsers.delete(userId);
                    }
                }
    
                await commit();
                res.json({ success: true });
    
                sendLog('admin', `[\`${req.userId}\`] *${req.user.username}* edited *${user.username}* (\`${userId}\`).\n\`\`\`\n${Object.keys(req.body).map(key => `${key} = ${req.body[key]}`).join('\n')}\n\`\`\``);
            
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
        }
    }
]);

module.exports = router;