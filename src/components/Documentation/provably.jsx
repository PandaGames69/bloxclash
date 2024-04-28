let PROVABLY_CODE = {
    CASES: `const crypto = require('crypto');

const CHARSROLL = 15;
const MAXROLL = 100000;

const combine = (serverSeed, clientSeed, nonce) => {
    return crypto.createHmac('sha256', serverSeed).update(clientSeed + ':' + nonce).digest('hex');
}

const getResult = hashedValue => {
    const partHash = hashedValue.slice(0, CHARSROLL);
    const roll = parseInt(partHash, 16) % MAXROLL;
    return roll + 1;
};

console.log(getResult(combine(serverSeed, clientSeed, nonce)));`,

    BATTLES: `const crypto = require('crypto');

const CHARSROLL = 15;
const MAXROLL = 100000;

const combine = (serverSeed, clientSeed, nonce) => {
    return crypto.createHmac('sha256', serverSeed).update(clientSeed + ':' + nonce).digest('hex');
}

const getResult = hashedValue => {
    const partHash = hashedValue.slice(0, CHARSROLL);
    const roll = parseInt(partHash, 16) % MAXROLL;
    return roll + 1;
};

// CHANGE THESE VALUES
const unhashedServerSeed = ''; // shown at the end of the game
const clientSeed = ''; // eos blockchain transaction id
const slots = 2; // count of players in the battle
const rounds = 15; // amount of cases/rounds in the battle
// 

for (let i = 0; i < rounds; i++) {

    console.log('Round ' + (i + 1) + ' results:');

    for (let r = 0; r < slots; r++) {
        const nonce = i * slots + r;
        console.log('Player on seat ' + (r + 1) + ':, ' + getResult(combine(unhashedServerSeed, clientSeed, nonce)));
    }

}`,

    ROULETTE: `const crypto = require('crypto');

const clientSeed = "00000000000000000003e5a54c2898a18d262eb5860e696441f8a4ebbff03697";

const getResult = serverSeed => {

    const hmac = crypto.createHmac('sha256', serverSeed);
    hmac.update(clientSeed);
    const sha = hmac.digest('hex');

    const result = parseInt(sha.substr(0, 8), 16) % 15;
    return result;

};

console.log(getResult(serverSeed)); // roulette number between 0-14`,

    CRASH: `const crypto = require('crypto');

const clientSeed = "00000000000000000003e5a54c2898a18d262eb5860e696441f8a4ebbff03697";
const houseEdge = 10;

const getResult = serverSeed => {

    const hmac = crypto.createHmac('sha256', serverSeed);
    hmac.update(clientSeed);
    
    const sha = hmac.digest('hex');

    const hex = sha.substr(0, 8);
    const int = parseInt(hex, 16);

    const crashpoint = Math.max(1, (2 ** 32 / (int + 1)) * (1 - (houseEdge / 100)));
    return crashpoint;

};

console.log(getResult(serverSeed)); // round crashpoint`,

    JACKPOT: `const crypto = require('crypto');

const combine = (serverSeed, clientSeed) => {
    return crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');
}

// returns a float between 0 and 1
const getFloatResult = hashedValue => {
    let decimalNumber = parseInt(hashedValue, 16);
    let maxDecimalValue = parseInt('f'.repeat(64), 16);
    let floatNumber = decimalNumber / (maxDecimalValue - 1);
    return Number(floatNumber.toFixed(7));
};

const percentageWinner = getFloatResult(combine(serverSeed, clientSeed));
const winnerTicket = Math.floor(totalTickets * percentageWinner);
console.log(winnerTicket);`,

    COINFLIP: `const crypto = require('crypto');

const combine = (serverSeed, clientSeed) => {
    return crypto.createHmac('sha256', serverSeed).update(clientSeed).digest('hex');
}

const getResult = hashedValue => {
    const number = parseInt(hashedValue.charAt(1), 16);
    return (number % 2 === 0) ? 'ice' : 'fire'
};

console.log(getResult(combine(serverSeed, clientSeed))); // winning side`,

    MINES: `import _ from "lodash";
    
const floats = _.flatten(
  generateFloats(server_seed, client_seed, nonce, 0, mines)
).map((float: number, index: number) => float * (25 - index));

const minePositions = shuffle(
  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
  floats
).slice(0, MINES);

console.log(floats);
console.log(minePositions);`,
}

function Provably(props) {

    function toggleDropdown(e) {
        e.target.parentElement.classList.toggle('active')
    }

    return (
        <>
            <div class='tos-container'>
                <div class='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        Cases

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z" fill="#9489DB"/>
                        </svg>
                    </button>

                    <div class='dropdown'>
                        <p>Each opening is calculated by the following variables:</p>
                        <ul>
                            <li><strong>Server Seed</strong> - provided by us</li>
                            <li><strong>Client Seed</strong> - provided by your browser and adjusted by you.</li>
                            <li><strong>Nonce</strong> - A number that increases with each case you open.</li>
                        </ul>
                        <p>
                            You will get an encrypted hash of the serverseed before you open a case. Since you get it in advance, the site cannot change it later. However it is encrypted, so you cannot calculate your own roll results in advance (only afterwards if you get the unhashed serverseed.).
                            <br/><br/>
                            To get the unhashed server seed, you’ll have to change your current one, that’ll reveal your previous server seed, and provide you with a new hashed one.
                            <br/><br/>
                            Your browser will generate a random clientseed. However, you could adjust this clientseed yourself and that won’t change the current server seed and nonce.
                            <br/><br/>
                            Each case item get’s an individual range of tickets according to their probability, the sum of all tickets it’s 100000. To pick a random item from the case, we generate a number between 1-100000 and then we find the item that’s on the range of the generated number.
                        </p>
                        <p><strong>Calculating Roll result</strong></p>
                        <p>This is a code snippet that can be run in NodeJS, it takes a serverseed, clientseed and a nonce and it returns a result number. The item that has it’s range of tickets inside the drawn result, it’s the one that get’s drawn in the case opening.</p>

                        <div class='code'>
                            <pre>
                                {PROVABLY_CODE.CASES}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        Case Battles

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>Each case opened is calculated by the following variables:</p>
                        <ul>
                            <li><strong>Server Seed</strong> - a randomly generated hash.</li>
                            <li><strong>Client Seed</strong> - the ID of an EOS block we commit to before it’s mined.</li>
                            <li><strong>Nonce</strong> - A number that increases with each case you open.</li>
                        </ul>
                        <p>
                            At creation, a server seed it’s generated for each battle, and it’s SHA256 hash is shown. After all players have joined and before the openings start, we commit to a future EOS block, and we will use it’s ID as the client seed once mined.
                            <br/><br/>
                            After the round is over the unhashed server seed will be revealed so users can confirm it’s SHA256 matches with the one shown previously.<br/>
                            This way, neither the players nor our system know what data will be used to generate the openings results until after all players have committed their bets.
                            <br/><br/>
                            Roll verification code is the same as individual case openings, but the nonce starts at 0 and increases by 1 on each opening.
                        </p>

                        <div className='code'>
                            <pre>
                                {PROVABLY_CODE.BATTLES}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        Roulette

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>In Roulette, our system generates the result for each round by using the SHA-256 hash of 2 inputs:</p>
                        <ul>
                            <li><strong>Server Seed</strong> - a series of hashes generated from a genesis seed.</li>
                            <li><strong>Client Seed</strong> - the hash of Bitcoin block 788,500.</li>
                        </ul>
                        <p>
                            To calculate the <strong>Server Seed</strong>, we begin with a genesis seed and hash it using the SHA-256 algorithm. We then hash the resuling seed, and repeat this process to generate 10 million Server Seeds. The first Roulette game uses the 10 millionth Server Seed, and each following game uses the next seed down the list. For example, the second game uses the 9,999,999th seed, the third game uses the 9,999,998th seed and so forth.
                            <br/><br/>

                            We revealed the last server seed on the chain and the Bitcoin Block number for the client seed before it got mined.
                            <br/><br/>

                            <strong>10th millionth server seed:</strong><br/>
                            acb0aa39d25f1a618ccf90cf695106c412759d07461a285dab94ac55c991aab4
                            <br/><br/>

                            <strong>Client seed: (Bitcoin Block 788,500 hash)</strong><br/>
                            00000000000000000003e5a54c2898a18d262eb5860e696441f8a4ebbff03697
                            <br/><br/>

                            For more information, check our announcement on Twitter.
                            Players can replicate any past roll by using the Node.js code below:
                        </p>

                        <div className='code'>
                            <pre>
                                {PROVABLY_CODE.ROULETTE}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        Crash

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>In Crash, our system generates the result for each round by using the SHA-256 hash of 2 inputs:</p>
                        <ul>
                            <li><strong>Server Seed</strong> - a series of hashes generated from a genesis seed.</li>
                            <li><strong>Client Seed</strong> - the hash of Bitcoin block 788,500.</li>
                        </ul>
                        <p>
                            To calculate the <strong>Server Seed</strong>, we begin with a genesis seed and hash it using the SHA-256 algorithm. We then hash the resuling seed, and repeat this process to generate 10 million Server Seeds. The first Crash game uses the 10 millionth Server Seed, and each following game uses the next seed down the list. For example, the second game uses the 9,999,999th seed, the third game uses the 9,999,998th seed and so forth.                            <br/><br/>

                            We revealed the last server seed on the chain and the Bitcoin Block number for the client seed before it got mined.
                            <br/><br/>

                            <strong>10th millionth server seed:</strong><br/>
                            acb0aa39d25f1a618ccf90cf695106c412759d07461a285dab94ac55c991aab4
                            <br/><br/>

                            <strong>Client seed: (Bitcoin Block 788,500 hash)</strong><br/>
                            00000000000000000003e5a54c2898a18d262eb5860e696441f8a4ebbff03697
                            <br/><br/>

                            For more information, check our announcement on Twitter.
                            Players can replicate any past roll by using the Node.js code below:
                        </p>

                        <div className='code'>
                            <pre>
                                {PROVABLY_CODE.CRASH}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        Jackpot

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>In Jackpot, our system generates the result for each round by using the SHA-256 hash of 2 inputs:</p>
                        <ul>
                            <li><strong>Server Seed</strong> - a randomly generated hash.</li>
                            <li><strong>Client Seed</strong> - the ID of an EOS block we commit to before it’s mined.</li>
                        </ul>
                        <p>
                            When a new jackpot round is created, we’ll make a random server seed and show it’s SHA256 hash. After all players have placed their bets, we’ll commit to a future block number on the EOS blockchain, once the block gets mined, we’ll use it’s ID as the Client seed.
                            <br/><br/>

                            After the round is over users the unhashed server seed will be revealed so users can confirm it’s SHA256 matches with the one shown previously.
                            <br/>
                            To determine the total number of tickets, multiply the total pot amount of the jackpot round times 100.
                        </p>

                        <div className='code'>
                            <pre>
                                {PROVABLY_CODE.JACKPOT}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        Coinflip

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>In Coinflip, our system generates the result for each round by using the SHA-256 hash of 2 inputs:</p>
                        <ul>
                            <li><strong>Server Seed</strong> - a randomly generated hash.</li>
                            <li><strong>Client Seed</strong> - the ID of an EOS block we commit to before it’s mined.</li>
                        </ul>
                        <p>
                            When a new coinflip game is created, we’ll make a random server seed and show it’s SHA256 hash. After all players have placed their bets, we’ll commit to a future block number on the EOS blockchain, once the block gets mined, we’ll use it’s ID as the Client seed.
                            <br/><br/>
                            After the round is over users the unhashed server seed will be revealed so users can confirm it’s SHA256 matches with the one shown previously.
                            <br/><br/>
                            Players can replicate the winning side of a coinflip game by using the Node.js code below:
                        </p>

                        <div className='code'>
                            <pre>
                                {PROVABLY_CODE.COINFLIP}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        Mines

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>In Mines, our system generates a 32-byte hexadecimal hash based on your server seed, client seed and nonce. This hash is converted into 4-byte parts which are used to generate floats between 0 and 1. These floats are looped through and multiplied by the remaining possible outcomes.</p>
                        <ul>
                            <li><strong>Server Seed</strong> - a SHA-256 hash of 16 cryptographically secure random bytes. This seed can be cycled by the user at any time.</li>
                            <li><strong>Client Seed</strong> - a seed that each user can customize at any time.</li>
                            <li><strong>Nonce</strong> - the round number that increments with each bet</li>
                        </ul>
                        <p>
                            For shuffling we use the Fisher–Yates shuffle algorithm to ensure there are no duplicate outcomes. In this case, it is utilised to ensure 2 mines don't occupy the same tile.
                            <br/><br/>
                            A hashed version of your current and next server seed is available at any time on the Mines page, and can be cycled at any time.
                            You can only unhash a game's server seed when you cycle your seeds, and the game's used server seed is no longer in use.
                        </p>

                        <div className='code'>
                            <pre>
                                {PROVABLY_CODE.MINES}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .tos-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;
                
                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;

                color: #ADA3EF;
                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 13px;
                font-weight: 400;
                
                display: flex;
                flex-direction: column;
                gap: 15px;
                
              }
              
              button {
                width: 100%;
                max-width: 525px;
                height: 40px;
                
                border: unset;
                outline: unset;
                cursor: pointer;

                color: #ADA3EF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 12px;
                font-weight: 700;
                text-align: left;
                
                padding: 0 15px;
                
                border-radius: 2px;
                background: rgba(90, 84, 153, 0.35);
                
                display: flex;
                align-items: center;
                justify-content: space-between;
                border: 1px solid transparent;
                
                transition: all .3s;
              }

              .active button {
                border-radius: 2px;
                border: 1px solid #5A5499;
                background: rgba(90, 84, 153, 0.05);
              }

              .active button svg {
                rotate: 180deg;
              }
              
              .dropdown {
                display: flex;
                flex-direction: column;
                
                max-height: 0;
                overflow: hidden;
                
                transition: max-height .3s;
              }
              
              .code {
                width: 100%;
                height: auto;

                background: #272549;
                color: #47C754;
                
                padding: 15px;
              }
              
              pre {
                margin: unset;
              }
              
              p {
                margin: revert;
              }
              
              .active .dropdown {
                max-height: 1250px;
              }
            `}</style>
        </>
    );
}

export default Provably;
