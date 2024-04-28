const { roundDecimal, sleep, sendLog } = require('../../../utils');
const io = require('../../../socketio/server');
const { sql, doTransaction } = require('../../../database');
const { mapItem } = require('../cases/functions');
const { getEOSBlockNumber, waitForEOSBlock } = require('../../../fairness/eos');
const { newBets } = require('../../../socketio/bets');
const { getResult, combine, sha256 } = require('../../../fairness');

const cachedBattles = {};

async function getBattle(battleId, privKey) {

    if (!privKey) privKey = null;
    const cached = cachedBattles[battleId];

    if (cached) {
        if (cached.privKey && cached.privKey != privKey) return false;
        return cached;
    }

    const [[battle]] = await sql.query(`
        SELECT * FROM battles WHERE id = ? ORDER BY id DESC
    `, [battleId]);

    if (!battle || battle.privKey != privKey) return false;

    const [rounds] = await sql.query(`
        SELECT cases.id, cases.name, cases.slug, cases.img, caseVersions.price, caseVersions.id as revId, battleRounds.round FROM battleRounds
        INNER JOIN caseVersions ON battleRounds.caseVersionId = caseVersions.id
        INNER JOIN cases ON caseVersions.caseId = cases.id
        WHERE battleId = ?
    `, [battle.id]);

    const [items] = await sql.query(`
        SELECT id, robloxId, name, img, price, rangeFrom, rangeTo, caseVersionId FROM caseItems WHERE caseVersionId IN (?)
    `, [rounds.map(e => e.revId)]);

    const cases = [...new Map(rounds.map(v => [v.id, v])).values()].map(e => {
        return {
            id: e.id,
            name: e.name,
            slug: e.slug,
            img: e.img,
            price: e.price,
            items: items.filter(i => i.caseVersionId == e.revId).map(e => mapItem(e))
        }
    });

    const [players] = await sql.query(`
        SELECT users.id, users.username, users.xp, users.role, users.anon, battlePlayers.slot, battlePlayers.team
        FROM battlePlayers INNER JOIN users ON battlePlayers.userId = users.id
        WHERE battlePlayers.battleId = ?
    `, [battle.id]);

    let openings = [];

    if (battle.startedAt) {
        [openings] = await sql.query(`
            SELECT battleOpenings.round, caseOpenings.userId, caseOpenings.caseItemId, fairRolls.seed, fairRolls.nonce, fairRolls.result FROM battleOpenings
            INNER JOIN caseOpenings ON battleOpenings.caseOpeningId = caseOpenings.id
            INNER JOIN fairRolls ON fairRolls.id = caseOpenings.rollId
            WHERE battleOpenings.battleId = ?
        `, [battle.id]);
    }

    const battleData = mapBattle(battle, cases, rounds, players, openings);
    if (!battle.startedAt) cachedBattles[battleId] = battleData;
    return battleData;

}

function battleCommitTo(battleId, commitTo) {

    if (!cachedBattles[battleId]) return;
    const battle = cachedBattles[battleId];

    battle.EOSBlock = commitTo;
    io.to('battles').emit('battles:commit', battleId, commitTo);
    io.to('battle:' + battleId).emit('battle:commit', battleId, commitTo);

}

function newBattlePlayer(battleId, user, slot, team) {

    if (!cachedBattles[battleId]) return;
    const battle = cachedBattles[battleId];

    const player = {
        id: user.id,
        username: user.username,
        xp: user.xp,
        role: user.role,
        slot,
        team
    };

    battle.players.push(player);
    io.to('battles').emit('battles:join', battleId, player);
    io.to('battle:' + battleId).emit('battle:join', battleId, player);

}

const minBattles = 10;

function battleEnded(battleId, winnerTeam, serverSeed, clientSeed) {

    const battle = cachedBattles[battleId];
    if (!battle) return;

    battle.winnerTeam = winnerTeam;
    battle.endedAt = new Date();

    io.to('battles').emit('battles:ended', battleId, winnerTeam);
    io.to('battle:' + battleId).emit('battle:ended', battleId, { winnerTeam, serverSeed, clientSeed });

    if (battle.privKey) {
        return setTimeout(() => {
            delete cachedBattles[battleId];
        }, 30000);
    }

    const publicBattles = Object.values(cachedBattles).filter(e => !e.privKey);

    if (publicBattles.length > minBattles) {
        const oldestEnded = publicBattles.filter(e => e.endedAt).sort((a, b) => a.endedAt - b.endedAt)[0];
        delete cachedBattles[oldestEnded?.id];
    }

}

async function cacheBattles() {

    const [battles] = await sql.query(`
        SELECT * FROM battles WHERE endedAt IS NULL ORDER BY id DESC
    `);

    if (battles.length < minBattles) {
        const [recentBattles] = await sql.query(`
            SELECT * FROM battles WHERE endedAt IS NOT NULL ORDER BY id DESC LIMIT ?
        `, [minBattles - battles.length]);
        battles.push(...recentBattles);
    }

    if (!battles.length) return;
    const battlesIds = battles.map(e => e.id);

    const [rounds] = await sql.query(`
        SELECT cases.id, cases.name, cases.slug, cases.img, battleRounds.round, caseVersions.price, caseVersions.id as revId, battleRounds.battleId FROM battleRounds
        INNER JOIN caseVersions ON battleRounds.caseVersionId = caseVersions.id
        INNER JOIN cases ON caseVersions.caseId = cases.id
        WHERE battleId IN (?) ORDER BY battleRounds.round ASC
    `, [battlesIds]);

    const [items] = await sql.query(`
        SELECT id, robloxId, name, img, price, rangeFrom, rangeTo, caseVersionId FROM caseItems WHERE caseVersionId IN (?)
    `, [rounds.map(e => e.revId)]);

    const [players] = await sql.query(`
        SELECT users.id, users.username, users.xp, users.role, users.anon, battlePlayers.slot, battlePlayers.team, battlePlayers.battleId
        FROM battlePlayers INNER JOIN users ON battlePlayers.userId = users.id
        WHERE battlePlayers.battleId IN (?) ORDER BY battlePlayers.slot ASC
    `, [battlesIds]);

    const cases = [...new Map(rounds.map(v => [v.id, v])).values()].map(e => {
        return {
            id: e.id,
            name: e.name,
            slug: e.slug,
            img: e.img,
            price: e.price,
            items: items.filter(i => i.caseVersionId == e.revId).map(e => mapItem(e))
        }
    });

    battles.forEach(battle => {

        const battleCases = cases.filter(e => rounds.some(r => r.id == e.id));
        const battleRounds = rounds.filter(e => e.battleId === battle.id);
        const battlePlayers = players.filter(e => e.battleId === battle.id);

        const data = mapBattle(battle, battleCases, battleRounds, battlePlayers);
        cachedBattles[battle.id] = data;

        if (battlePlayers.length == (battle.teams * battle.playersPerTeam) && !battle.endedAt) {
            startBattle(battle, battlePlayers)
        }

    })

}

function mapBattle(battle, cases, rounds, players, openings = []) {

    return {
        id: battle.id,
        entryPrice: battle.entryPrice,
        teams: battle.teams,
        round: battle.round,
        privKey: battle.privKey,
        minLevel: battle.minLevel,
        ownerFunding: battle.ownerFunding,
        playersPerTeam: battle.playersPerTeam,
        EOSBlock: battle.EOSBlock,
        clientSeed: battle.clientSeed,
        serverSeed: battle.startedAt ? battle.serverSeed : sha256(battle.serverSeed),
        gamemode: battle.gamemode,
        cases,
        players: players.map(e => {
            return {
                id: e.id,
                username: e.username,
                xp: e.xp,
                role: e.role,
                slot: e.slot,
                team: e.team
            }
        }),
        rounds: rounds.map(e => {
            return {
                caseId: e.id,
                round: e.round,
                items: openings.filter(i => i.round == e.round).map(e => {
                    return {
                        userId: e.userId,
                        nonce: e.nonce,
                        result: e.result,
                        seed: e.seed,
                        itemId: e.caseItemId
                    }
                })
            }
        }),
        winnerTeam: battle.winnerTeam,
        createdAt: battle.createdAt,
        startedAt: battle.startedAt,
        endedAt: battle.endedAt
    }

}

function minifyBattle(battle) {
    const newBattle = {...battle};
    // delete newBattle.privKey;
    newBattle.cases = newBattle.cases.map(e => {
        const newCase = {...e};
        delete newCase.items;
        return newCase;
    });
    return newBattle;
}

const rollTime = 6500;

async function startBattle(battle, players) {

    const [cases] = await sql.query(`
        SELECT cases.id, cases.name, cases.slug, cases.img, caseVersions.price, caseVersions.id as revId, battleRounds.round FROM battleRounds
        INNER JOIN caseVersions ON battleRounds.caseVersionId = caseVersions.id
        INNER JOIN cases ON caseVersions.caseId = cases.id
        WHERE battleRounds.battleId = ? ORDER BY battleRounds.round ASC
    `, [battle.id]);

    const [casesItems] = await sql.query(`SELECT * FROM caseItems WHERE caseVersionId IN(?);`, [cases.map(e => e.revId)]);

    const itemsByCase = {};
    casesItems.forEach(e => {
        if (!itemsByCase[e.caseVersionId]) itemsByCase[e.caseVersionId] = [];
        itemsByCase[e.caseVersionId].push(e);
    });
    
    let commitTo = battle.EOSBlock;

    if (!commitTo) {

        const blockNumber = await getEOSBlockNumber();
        commitTo = blockNumber + 2;
    
        await sql.query("UPDATE battles SET EOSBlock = ? WHERE id = ?", [commitTo, battle.id]);
        battleCommitTo(battle.id, commitTo);

    }

    const clientSeed = battle.clientSeed || await waitForEOSBlock(commitTo);

    let nonce = 0;
    const rounds = [];
    let total = 0;

    const revIds = {};
    const teams = {};
    const teamsResults = {};

    for (let i = 0; i < cases.length; i++) {

        const c = cases[i];
        revIds[c.id] = c.revId;

        const caseItems = itemsByCase[c.revId];
        const items = [];

        for (let p = 0; p < players.length; p++) {

            nonce++;

            const player = players[p];
            const seed = combine(battle.serverSeed, clientSeed, nonce);
            const result = getResult(seed);

            const item = caseItems.find(e => result >= e.rangeFrom && result <= e.rangeTo);
            if (!item) throw new Error('Item not found');
    
            items.push({
                userId: player.id,
                nonce: nonce,
                result,
                seed,
                itemId: item.id // mapItem(item)
            });

            total += item.price;
            teams[player.team] = (teams[player.team] || 0) + item.price;
            teamsResults[player.team] = (teamsResults[player.team] || 0) + result;

        }

        rounds.push({
            caseId: c.id,
            round: c.round,
            items
        });

    }

    const cachedBattle = cachedBattles[battle.id];
    cachedBattle.rounds = rounds;

    if (battle.round) {

        const timeTillNextRound = battle.createdAt.getTime() + (rollTime * battle.round) - Date.now();
        await sleep(timeTillNextRound);

    }

    for (let i = battle.round; i < rounds.length; i++) {
        
        const round = rounds[i];

        try {
    
            await doTransaction(async (connection, commit) => {

                if (!cachedBattle.startedAt) {

                    const fairRollsData = rounds.map(e => e.items).flat().map(e => [battle.serverSeed, clientSeed, e.nonce, e.seed, e.result]);
                    const fairRollsIds = [];
                
                    for (const row of fairRollsData) {
                        const [result] = await connection.query(`INSERT INTO fairRolls (serverSeed, clientSeed, nonce, seed, result) VALUES (?)`, [row]);
                        fairRollsIds.push(result.insertId);
                    }
                
                    const caseOpeningsData = rounds.map(r => r.items.map((e, i) => [e.userId, revIds[r.caseId], fairRollsIds.shift(), e.itemId])).flat();
                    const caseOpeningsIds = [];
                
                    for (const row of caseOpeningsData) {
                        const [result] = await connection.query(`INSERT INTO caseOpenings (userId, caseVersionId, rollId, caseItemId) VALUES (?)`, [row]);
                        caseOpeningsIds.push(result.insertId);
                    }

                    const battleOpeningsData = rounds.map((r, o) => r.items.map((e, i) => [battle.id, caseOpeningsIds.shift(), r.round])).flat();
                
                    for (const row of battleOpeningsData) {
                        await connection.query(`INSERT INTO battleOpenings (battleId, caseOpeningId, round) VALUES (?)`, [row]);
                    }

                    await connection.query(`UPDATE battles SET round = ?, startedAt = NOW(), clientSeed = ? WHERE id = ?`, [round.round, clientSeed, battle.id]);
                    cachedBattle.startedAt = new Date();
                    cachedBattle.clientSeed = clientSeed;
                    cachedBattle.serverSeed = battle.serverSeed;
                    io.to('battle:' + battle.id).emit('battle:start', battle.id, rounds, clientSeed, battle.serverSeed);
                    
                } else {
                    await connection.query(`UPDATE battles SET round = ? WHERE id = ?`, [round.round, battle.id]);
                }

                await commit();

            });

        } catch (e) {
            return console.error(e);
        }

        io.to('battles').emit('battles:round', battle.id, round.round);
        io.to('battle:' + battle.id).emit('battle:round', battle.id, round.round);

        if (cachedBattle) {
            cachedBattle.round = round.round;
            // cachedBattle.rounds = rounds.slice(0, i + 1);
        }

        await sleep(rollTime);

    }

    const winnerTeams = Object.keys(teams).reduce((minKeys, currentKey) => {
        if (!minKeys.length) {
            return [currentKey];
        }
        
        const currentValue = teams[currentKey];
        const minValue = teams[minKeys[0]];
        
        if (battle.gamemode == 'crazy' ? currentValue < minValue : currentValue > minValue) {
            return [currentKey];
        } else if (currentValue === minValue) {
            return [...minKeys, currentKey];
        } else {
            return minKeys;
        }
    }, []);

    // get team from winnerTeams with highest price (lowest result) range rolls
    const winnerTeam = +(winnerTeams.reduce((a, b) => teamsResults[a] < teamsResults[b] ? a : b));

    const teamPlayers = players.filter(e => e.team == winnerTeam);
    const amount = roundDecimal(total / teamPlayers.length);

    const winnersIds = teamPlayers.map(e => e.id);

    try {

        await doTransaction(async (connection, commit) => {
        
            await connection.query(`UPDATE users SET balance = balance + ? WHERE id IN(?) AND role <> ?`, [amount, winnersIds, 'bot']);
            await connection.query(`UPDATE battles SET winnerTeam = ?, endedAt = NOW() WHERE id = ?`, [winnerTeam, battle.id]);
        
            await connection.query(`
                UPDATE bets SET completed = 1, winnings = CASE WHEN userId IN (?) THEN ? ELSE 0 END WHERE game = ? AND gameId = ?`,
                [winnersIds, amount, 'battle', battle.id]
            );

            await commit();

        });

    } catch (e) {
        return console.error(e);
    }

    let totalCost = 0;
        
    newBets(players.map(e => {

        let cost = battle.entryPrice;

        if (e.id == battle.ownerId && battle.ownerFunding) {
            const realEntryPrice = cases.reduce((a, b) => a + b.price, 0);
            const fundingAmount = (realEntryPrice - battle.entryPrice) * (players.length - 1)
            cost = roundDecimal(realEntryPrice + fundingAmount);
        }

        totalCost += cost;

        const winner = winnersIds.includes(e.id);
        if (winner) io.to(e.id).emit('balance', 'add', amount);
        
        return {
            user: e,
            amount: cost,
            edge: roundDecimal(amount * 0.1),
            payout: winner ? amount : 0,
            game: 'battle'
        }

    }));

    battleEnded(battle.id, winnerTeam, battle.serverSeed, clientSeed);

    const battleUrl = `${process.env.FRONTEND_URL}/battle/${battle.id}${battle.privKey ? `?pk=${battle.privKey}` : ''}`;

    sendLog('battles',{
        blocks: [{
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*<${battleUrl}|Battle #${battle.id}>* Ended - Edge: :robux: R$${roundDecimal(totalCost - total)}`
            }
        }]
    });

}

module.exports = {
    cacheBattles,
    getBattle,
    cachedBattles,
    minifyBattle,
    newBattlePlayer,
    startBattle
}