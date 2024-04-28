const _ = require("lodash");
const crypto = require("crypto");

const houseEdge = 7.5 / 100;
const totalTiles = 25;

function shuffle(array,floats, includeMatrix = false) {

    const copy = [];
    const breakdown = [];
    let n = array.length;

    while (n > 1) {
        if (includeMatrix) {
            breakdown.push([...copy, ...array]);
        }

        const i = Math.floor(floats[copy.length]);

        n--;

        copy.push(array.splice(i, 1)[0]);
    }

    return includeMatrix ? [copy, breakdown] : copy;
}

function* byteGenerator(serverSeed, clientSeed, nonce, cursor) {

    let currentRound = Math.floor(cursor / 32);
    let currentRoundCursor = cursor;
    currentRoundCursor -= currentRound * 32;

    while (true) {
        const hmac = crypto.createHmac("sha256", serverSeed);
        hmac.update(`${clientSeed}:${nonce}:${currentRound}`);
        const buffer = hmac.digest();

        while (currentRoundCursor < 32) {
            yield Number(buffer[currentRoundCursor]);
            currentRoundCursor += 1;
        }
        currentRoundCursor = 0;
        currentRound += 1;
    }

}

function generateFloats(serverSeed, clientSeed, nonce, cursor, count) {

    const numbers = byteGenerator(serverSeed, clientSeed, nonce, cursor);
    const bytes = [];

    while (bytes.length < count * 4) {
        bytes.push(numbers.next().value);
    }

    return _.chunk(bytes, 4).map((bytesChunk) =>
        bytesChunk.reduce((result, value, i) => {
            const divider = 256 ** (i + 1);
            const partialResult = value / divider;
            return result + partialResult;
        }, 0)
    );

}

function generateMinePositions(serverSeed, clientSeed, nonce, mines) {

    const floats = _.flatten(
        generateFloats(serverSeed, clientSeed, nonce, 0, mines)
    ).map((float, index) => float * (25 - index));

    const minePositions = shuffle(
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        floats
    ).slice(0, mines);

    return minePositions;

}

function calculateMultiplier(mineCount, revealedTiles) {

    if (revealedTiles < 1) return 1;

    let successProbability = 1;
    for (let i = 0; i < revealedTiles; i++) {
        successProbability *= (totalTiles - mineCount - i) / (totalTiles - i);
    }

    const idealMultiplier = 1 / successProbability;
    const adjustedMultiplier = idealMultiplier * (1 - houseEdge);

    return +(adjustedMultiplier.toFixed(2));

}

module.exports = {
    calculateMultiplier,
    generateMinePositions,
    totalTiles,
    houseEdge
}