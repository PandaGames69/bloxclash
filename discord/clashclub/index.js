const sharp = require("sharp");
const path = require('path');
const TextToSVG = require('text-to-svg');
const textToSVG = TextToSVG.loadSync(path.join(__dirname, 'Geogrotesque.otf'));
const { sql } = require('../../database');
const { discordClient, discordIds } = require('../index');
const { getRandomInt, hourMs } = require('../../utils');

const templatePath = path.join(__dirname, 'template.png');
const outputPath = path.join(__dirname, 'output.png');

async function startClashClub(lastSent) {

    if (!lastSent) {
        const [[last]] = await sql.query(`SELECT createdAt FROM promoCodes WHERE clashClub = 1 ORDER BY createdAt DESC LIMIT 1`);
        lastSent = last ? last.createdAt.valueOf() : 0;
    }

    const randomRange = hourMs * 6;
    const random = getRandomInt(-randomRange, randomRange)
    const nextClashClubIn = hourMs * 24 - random - (Date.now() - lastSent);

    // console.log(nextClashClubIn);
    setTimeout(postClashClub, nextClashClubIn);

}

function generateCode(length = 8) {
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < length; i++) result += chars.charAt(getRandomInt(0, chars.length - 1));    
    return result;

}

async function postClashClub() {

    const amounts = [25, 50, 75, 100];
    const amount = amounts[getRandomInt(0, amounts.length - 1)];

    const uses = getRandomInt(1, 5);
    const code = generateCode();

    await sql.query(`INSERT INTO promoCodes (code, amount, totalUses, clashClub) VALUES (?, ?, ?, 1)`, [code, amount, uses]);

    const codeSvg = textToSVG.getSVG(code, {
        x: 0,
        y: 0,
        fontSize: 36,
        anchor: 'top',
        attributes: {
            fill: '#f8ab39',
            'stroke-width': '0.1px',
        }
    });

    const amountSvg = textToSVG.getSVG(amount.toString(), {
        x: 0,
        y: 0,
        fontSize: 38,
        anchor: 'top',
        attributes: {
            fill: 'white',
            stroke: 'black',
            'stroke-width': '0.1px'
        }
    });

    const codeWidth = textToSVG.getWidth(code, {
        fontSize: 36,
        anchor: 'top'
    });

    const areaWidthForCode = 210;
    const leftForCode = Math.floor((areaWidthForCode - codeWidth) / 2);

    const amountWidth = textToSVG.getWidth(amount, {
        fontSize: 38,
        anchor: 'top'
    });

    const areaWidthForAmount = 75; 
    const leftForAmount = Math.floor((areaWidthForAmount - amountWidth) / 2);
    
    await sharp(templatePath).composite([
        {
            input: Buffer.from(codeSvg),
            top: 278,
            left: 232 + leftForCode
        },
        {
            input: Buffer.from(amountSvg),
            top: 275,
            left: 590 + leftForAmount 
        }
    ]).toFile(outputPath);

    const channel = await discordClient.channels.fetch(discordIds.clashClub);

    await channel.send({
        content: `@everyone`,
        files: [outputPath]
    });

    startClashClub(Date.now());

}

startClashClub();