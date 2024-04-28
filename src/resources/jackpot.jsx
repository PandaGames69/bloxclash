import {getRandomNumber} from "../util/api";

export const generateBets = (bets, total) => {
    if (!Array.isArray(bets)) return [];

    total *= 100
    const randomBets = [];

    for (let i = 0; i < 70; i++) {
        let randomTicket = getRandomNumber(0, total - 1)
        let currentTicket = -1

        for (let bet of bets) {
            currentTicket += (bet.amount * 100)
            if (randomTicket <= currentTicket) {
                randomBets.push(bet);
                break;
            }
        }
    }

    return randomBets;
}