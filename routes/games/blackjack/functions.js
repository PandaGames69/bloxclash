const crypto = require("crypto");

const deck = [
    {face: 'A', suit: '♥'},
    {face: '2', suit: '♥'},
    {face: '3', suit: '♥'},
    {face: '4', suit: '♥'},
    {face: '5', suit: '♥'},
    {face: '6', suit: '♥'},
    {face: '7', suit: '♥'},
    {face: '8', suit: '♥'},
    {face: '9', suit: '♥'},
    {face: '10', suit: '♥'},
    {face: 'J', suit: '♥'},
    {face: 'Q', suit: '♥'},
    {face: 'K', suit: '♥'},
    {face: 'A', suit: '♠'},
    {face: '2', suit: '♠'},
    {face: '3', suit: '♠'},
    {face: '4', suit: '♠'},
    {face: '5', suit: '♠'},
    {face: '6', suit: '♠'},
    {face: '7', suit: '♠'},
    {face: '8', suit: '♠'},
    {face: '9', suit: '♠'},
    {face: '10', suit: '♠'},
    {face: 'J', suit: '♠'},
    {face: 'Q', suit: '♠'},
    {face: 'K', suit: '♠'},
    {face: 'A', suit: '♦'},
    {face: '2', suit: '♦'},
    {face: '3', suit: '♦'},
    {face: '4', suit: '♦'},
    {face: '5', suit: '♦'},
    {face: '6', suit: '♦'},
    {face: '7', suit: '♦'},
    {face: '8', suit: '♦'},
    {face: '9', suit: '♦'},
    {face: '10', suit: '♦'},
    {face: 'J', suit: '♦'},
    {face: 'Q', suit: '♦'},
    {face: 'K', suit: '♦'},
    {face: 'A', suit: '♣'},
    {face: '2', suit: '♣'},
    {face: '3', suit: '♣'},
    {face: '4', suit: '♣'},
    {face: '5', suit: '♣'},
    {face: '6', suit: '♣'},
    {face: '7', suit: '♣'},
    {face: '8', suit: '♣'},
    {face: '9', suit: '♣'},
    {face: '10', suit: '♣'},
    {face: 'J', suit: '♣'},
    {face: 'Q', suit: '♣'},
    {face: 'K', suit: '♣'},
];
  
function getBlackjackCard(serverSeed, clientSeed, nonce, index) {
    const seed = getCombinedSeed(serverSeed, clientSeed, nonce, index);
    const hash = crypto.createHmac("sha256", seed).digest("hex");
    return getBlackjackCardFromHash(hash);
}

function getCombinedSeed(serverSeed, clientSeed, nonce, index) {
    return `${serverSeed}-${clientSeed}-${nonce}-${index}`;
}

function getBlackjackCardFromHash(hash) {

    const subHash = hash.substring(0, 8);
    const roll = Number.parseInt(subHash, 16);
    const cardRoll = roll % deck.length;

    const suit = deck[cardRoll].suit;
    const face = deck[cardRoll].face;
    return suit + face;

}

module.exports = {
    getBlackjackCard
}