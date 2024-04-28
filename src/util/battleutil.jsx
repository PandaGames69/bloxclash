export function fillEmptySlots(max, players) {
    let filledArray = Array(max).fill(null);

    for (let i = 0; i < players.length; i++) {
        let index = players[i]?.slot - 1;
        filledArray[index] = players[i];
    }

    return filledArray;
}

export function calculateWinnings(cases, rounds, players) {
    if (!Array.isArray(cases) || !Array.isArray(rounds)) return

    let total = 0

    for (let round of rounds) {
        if (!round) return

        let caseItems = cases?.find(c => c.id === round.caseId)?.items

        for (let item of round?.items) {
            let winningItem = caseItems?.find(i => item.itemId === i.id)
            total += winningItem.price
        }
    }

    return Math.floor(total / players)
}

export function convertItems(items, cases, caseId, round) {
    let convertedItems = []

    let caseItems = cases?.find(c => c.id === caseId)?.items
    if (!caseItems) return

    items.forEach(item => {
        let caseItem = {...caseItems.find(i => i.id === item.itemId)}
        caseItem.userId = item.userId

        if (typeof round === 'number') {
            caseItem.round = round
        }

        convertedItems.push(caseItem)
    })

    return convertedItems
}

export function getWonItems(rounds, cases) {
    let items = []

    for (let i = 0; i < rounds?.length; i++) {
        let currentRound = rounds[i]
        if (!currentRound || !currentRound.caseId) return
        items.push(...convertItems(currentRound.items, cases, currentRound.caseId, i + 1))
    }

    return items
}

/**
 * @param itemsInRound - CONVERTED Array of items, should include price on each object
 * @param playersPerTeam - Players per team so we can calculate winning teams
 * @returns {number []} - Calculates the teams that win the current round and returns it as an array of ints
 */
export function getRoundWinner(itemsInRound, playersPerTeam) {
    let teamValues = [0,0,0,0,0]
    let winningTeams = []

    for (let j = 0; j < itemsInRound.length; j++) {
        let team = Math.floor(j / playersPerTeam)
        teamValues[team] += itemsInRound[j].price
    }

    let biggestWinnings = Math.max(...teamValues)

    for (let j = 0; j < teamValues.length; j++) {
        let team = Math.floor(j / playersPerTeam)
        if (teamValues[team] === biggestWinnings) winningTeams.push(team)
    }

    return winningTeams
}