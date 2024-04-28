const express = require('express');
const router = express.Router();

const { isAuthed, apiLimiter } = require('../../auth/functions');
const { roundDecimal, getUserLevel, sendLog, xpChanged } = require('../../../utils');
const { generateServerSeed, sha256 } = require('../../../fairness');
const { sql, doTransaction } = require('../../../database');
const { mapItem } = require('../cases/functions');
const { cachedBattles, minifyBattle, newBattlePlayer, startBattle } = require('./functions');
const { enabledFeatures, xpMultiplier } = require('../../admin/config');

const io = require('../../../socketio/server');

const { default: PQueue } = require('p-queue');
const joinQueue = new PQueue({ concurrency: 1 });

router.use((req, res, next) => {
    
    if (!enabledFeatures.battles) return res.status(400).json({ error: 'DISABLED' });
    next();

});

router.post('/create', isAuthed, apiLimiter, async (req, res) => {

    const casesIds = req.body.cases;
    if (!Array.isArray(casesIds)) return res.status(400).json({ error: 'MISSING_CASES' });
    if (!casesIds.length || casesIds.length > 50 || casesIds.some((e) => !Number.isInteger(e))) return res.status(400).json({ error: 'INVALID_CASES' });

    const gamemode = req.body.gamemode;
    if (!['standard', 'crazy', 'group'].includes(gamemode)) return res.status(400).json({ error: 'INVALID_GAMEMODE' });
    
    const teams = req.body.teams;
    if (!Number.isInteger(teams)) return res.status(400).json({ error: 'MISSING_TEAMS' });

    const playersPerTeam = req.body.playersPerTeam;
    if (!Number.isInteger(playersPerTeam)) return res.status(400).json({ error: 'MISSING_PLAYERS_PER_TEAM' });

    if (gamemode == 'group') {
        if (teams != 1) {
            sendLog('battle', `\`${req.userId}\` tried to perform RblxWild's exploit.`)
            return res.status(400).json({ error: 'INVALID_GAMEMODE', m: 'Are you serious?!' });
        }
        if (playersPerTeam < 2 || playersPerTeam > 4) return res.status(400).json({ error: 'INVALID_GAMEMODE' });
    } else {

        if (teams < 2 || teams > 4) return res.status(400).json({ error: 'INVALID_TEAMS' });
    
        if (playersPerTeam < 1 || playersPerTeam > 2) return res.status(400).json({ error: 'INVALID_PLAYERS_PER_TEAM' });
        if (teams > 2 && playersPerTeam > 2) return res.status(400).json({ error: 'INVALID_PLAYERS_PER_TEAM' }); // only allow 2v2 for now

    }

    if (typeof req.body.funding != 'number') return res.status(400).json({ error: 'MISSING_FUNDING' });
    const fundingPercentage = req.body.funding;
    if (!Number.isInteger(fundingPercentage) || fundingPercentage < 0 || fundingPercentage > 100) return res.status(400).json({ error: 'INVALID_FUNDING' });
    
    const minLvl = req.body.minLvl;
    if (!Number.isInteger(minLvl)) return res.status(400).json({ error: 'MISSING_MIN_LVL' });
    if (minLvl < 0 || minLvl > 100) return res.status(400).json({ error: 'INVALID_MIN_LVL' });

    const private = req.body.isPrivate;
    if (typeof private != 'boolean') return res.status(400).json({ error: 'MISSING_PRIVATE' });
    
    const uniqueCaseIds = [...new Set(casesIds)];

    const [uniqueCases] = await sql.query(`
        SELECT cases.id, cases.name, cases.slug, cases.img, caseVersions.price, caseVersions.id as revId FROM cases
        INNER JOIN caseVersions ON cases.id = caseVersions.caseId AND caseVersions.endedAt IS NULL
        WHERE cases.id IN(?);
    `, [uniqueCaseIds]);

    if (uniqueCases.length != uniqueCaseIds.length) return res.status(400).json({ error: 'INVALID_CASES' });

    const cases = casesIds.map(id => uniqueCases.find(e => e.id == id));
    const battleCost = cases.reduce((acc, cur) => acc + cur.price, 0);

    const fundingAmount = battleCost * ((teams * playersPerTeam) - 1) * (fundingPercentage / 100);
    const cost = roundDecimal(battleCost + fundingAmount);

    try {

        await doTransaction(async (connection, commit) => {

            const [[user]] = await connection.query('SELECT id, username, xp, balance, role, sponsorLock, perms FROM users WHERE id = ? FOR UPDATE', [req.userId]);
            if (cost > user.balance) return res.status(400).json({ error: 'INSUFFICIENT_BALANCE' });
            
            if (user.sponsorLock && fundingPercentage != 0) return res.status(400).json({ error: 'SPONSOR_LOCK_FUNDING' });
        
            if (user.perms < 1) {
                const [[{ total }]] = await connection.query(`
                    SELECT COUNT(*) as total FROM battles WHERE ownerId = ? AND endedAt IS NULL
                `, [user.id]);

                if (total >= 3) return res.status(400).json({ error: 'TOO_MANY_BATTLES' });
            }

            const xp = roundDecimal(cost * xpMultiplier);
            await connection.query(`UPDATE users SET balance = balance - ?, xp = xp + ? WHERE id = ?`, [cost, xp, user.id, cost]);
    
            io.to(user.id).emit('balance', 'set', roundDecimal(user.balance - cost));
            await xpChanged(user.id, user.xp, roundDecimal(user.xp + xp), connection);
    
            const privKey = private ? Math.random().toString(36).substring(2, 6) : null;
            const serverSeed = generateServerSeed();
             
            const entryPrice = roundDecimal(battleCost * (1 - (fundingPercentage / 100)));
        
            const [battleResult] = await connection.query(
                `INSERT INTO battles (ownerId, ownerFunding, entryPrice, privKey, minLevel, teams, playersPerTeam, gamemode, serverSeed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [user.id, fundingPercentage, entryPrice, privKey, minLvl, teams, playersPerTeam, gamemode, serverSeed]
            );
            
            const battleId = battleResult.insertId;
        
            const [roundsResult] = await connection.query(
                `INSERT INTO battleRounds (battleId, caseVersionId, round) VALUES ?`,
                [cases.map((e, i) => [battleId, e.revId, i + 1])]
            );
        
            await connection.query(`INSERT INTO battlePlayers (battleId, userId, slot, team) VALUES (?, ?, ?, ?)`, [battleId, user.id, 1, 1]);
            await connection.query('INSERT INTO bets (userId, amount, edge, game, gameId, completed) VALUES (?, ?, ?, ?, ?, ?)', [user.id, cost, roundDecimal(cost * 0.1), 'battle', battleId, false]);
        
            await commit();
            res.json({ success: true, battleId, privKey });
    
            const [items] = await connection.query(`
                SELECT id, robloxId, name, img, price, rangeFrom, rangeTo, caseVersionId FROM caseItems WHERE caseVersionId IN (?)
            `, [uniqueCases.map(e => e.revId)]);
        
            cachedBattles[battleId] = {
                id: battleId,
                entryPrice: entryPrice,
                teams: teams,
                privKey: privKey,
                round: 0,
                ownerFunding: fundingPercentage,
                playersPerTeam: playersPerTeam,
                clientSeed: null,
                EOSBlock: null,
                serverSeed: sha256(serverSeed),
                gamemode: gamemode,
                cases: uniqueCases.map(e => ({
                    ...e,
                    items: items.filter(i => i.caseVersionId == e.revId).map(e => mapItem(e))
                })),
                rounds: cases.map((e, i) => ({ caseId: e.id, round: i + 1, items: [] })),
                players: [{
                    id: user.id,
                    username: user.username,
                    xp: user.xp,
                    role: user.role,
                    slot: 1,
                    team: 1
                }],
                winnerTeam: null,
                createdAt: new Date(),
                startedAt: null,
                endedAt: null
            }
        
            if (privKey) {
                io.to(user.id).emit('battles:push', [minifyBattle(cachedBattles[battleId])]);
            } else {
                io.to('battles').emit('battles:push', [minifyBattle(cachedBattles[battleId])]);
            }

        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
    
});

router.post('/:id/join', isAuthed, apiLimiter, async (req, res) => {
    joinBattle(req, res);
});

async function joinBattle(req, res, bot = false) {

    await joinQueue.add(async () => {

        const battleId = parseInt(req.params.id);
        if (!Number.isInteger(battleId)) return res.status(400).json({ error: 'MISSING_BATTLE_ID' });

        try {

            await doTransaction(async (connection, commit) => {

                const [[battle]] = await connection.query(`SELECT * FROM battles WHERE id = ? FOR UPDATE`, [battleId]);
                if (!battle) return res.status(400).json({ error: 'INVALID_BATTLE_ID' });

                if (battle.winnerTeam || battle.startedAt) return res.status(400).json({ error: 'ALREADY_STARTED' });
                const totalPlayers = battle.teams * battle.playersPerTeam;

                const slot = parseInt(req.body.slot);
                if (!Number.isInteger(slot)) return res.status(400).json({ error: 'MISSING_SLOT' });
                if (slot < 1 || slot > totalPlayers) return res.status(400).json({ error: 'INVALID_SLOT' });

                const [players] = await connection.query(`
                    SELECT users.id, users.username, users.xp, users.anon, battlePlayers.slot, battlePlayers.team FROM battlePlayers
                    INNER JOIN users ON users.id = battlePlayers.userId
                    WHERE battleId = ? ORDER BY slot ASC FOR UPDATE
                `, [battleId]);

                let user;

                if (bot) {
                    // console.log(battle.ownerId, req.userId)
                    if (battle.ownerId != req.userId) return res.status(403).json({ error: 'FORBIDDEN' });
                    [[user]] = await connection.query('SELECT id, username, xp, role, anon FROM users WHERE id NOT IN(?) AND role = ? LIMIT 1', [players.map(e => e.id), 'BOT']);
                    if (!user) return res.status(500).json({ error: 'NO_BOTS_AVAILABLE' });

                    const taken = players.find(e => e.slot == slot);
                    if (taken) return res.status(400).json({ error: 'SLOT_TAKEN' });

                } else {

                    if (battle.privKey && battle.privKey != req.body.privKey) return res.status(400).json({ error: 'INVALID_PRIV_KEY' });

                    [[user]] = await connection.query('SELECT id, username, xp, balance, role, anon, perms, sponsorLock FROM users WHERE id = ? FOR UPDATE', [req.userId]);
                    if (user.balance < battle.entryPrice) return res.status(400).json({ error: 'INSUFFICIENT_BALANCE' });

                    const level = getUserLevel(user.xp);
                    if (level < battle.minLevel) return res.status(400).json({ error: 'INSUFFICIENT_LEVEL' });

                    const taken = players.find(e => e.id == user.id || e.slot == slot);
                    if (taken) return res.status(400).json({ error: taken.id == user.id ? 'ALREADY_IN_BATTLE' : 'SLOT_TAKEN' });
                
                    if (battle.entryPrice > 0) {

                        const xp = roundDecimal(battle.entryPrice * xpMultiplier);
                        const [balanceResult] = await connection.query(`UPDATE users SET balance = balance - ?, xp = xp + ? WHERE id = ? AND balance > ?`, [battle.entryPrice, xp, user.id, battle.entryPrice]);
                        if (balanceResult.affectedRows != 1) return res.status(500).json({ error: 'INSUFFICIENT_BALANCE' });

                        io.to(user.id).emit('balance', 'set', roundDecimal(user.balance - battle.entryPrice));
                        await xpChanged(user.id, user.xp, roundDecimal(user.xp + xp), connection);

                    }

                }

                await connection.query('INSERT INTO bets (userId, amount, edge, game, gameId, completed) VALUES (?, ?, ?, ?, ?, ?)', [user.id, battle.entryPrice, roundDecimal(battle.entryPrice * 0.1), 'battle', battleId, 0]);

                const team = Math.floor((slot - 1) / battle.playersPerTeam) + 1; 
                await connection.query(`INSERT INTO battlePlayers (battleId, userId, slot, team) VALUES (?, ?, ?, ?)`, [battleId, user.id, slot, team]);

                await commit();
                res.json({ success: true });
                newBattlePlayer(battleId, user, slot, team);

                if (players.length + 1 != totalPlayers) return;
                players.splice(slot - 1, 0, { id: user.id, username: user.username, xp: user.xp, slot: slot, team: team, anon: user.anon });

                startBattle(battle, players);

            });

        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'INTERNAL_ERROR' });
        }

    });

}

router.post('/leave', isAuthed, apiLimiter, async (req, res) => {
    res.json({ error: 'DISABLED' });
});

router.post('/:id/bot', isAuthed, apiLimiter, async (req, res) => {
    joinBattle(req, res, true);
});

module.exports = router;