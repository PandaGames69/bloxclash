import {useWebsocket} from "../contexts/socketprovider";
import {useUser} from "../contexts/usercontextprovider";
import {createResource, createSignal, For} from "solid-js";
import {authedAPI, createNotification} from "../util/api";
import {Meta, Title} from "@solidjs/meta";
import {formatNumber} from "../util/numbers";
import Tile from "../components/Mines/tile";

function Mines(props) {

    const [bet, setBet] = createSignal(100)
    const [mines, setMines] = createSignal(3)
    const [revealed, setRevealed] = createSignal([])
    const [bombs, setBombs] = createSignal([])
    const [game, { mutate: setGame }] = createResource(getActiveGame)

    const [isProcessing, setIsProcessing] = createSignal(false)
    const [random, setRandom] = createSignal(null)

    let cashoutSFX = new Audio('/assets/sfx/winorcashout.mp3')

    async function getActiveGame() {
        let game = await authedAPI(`/mines`, 'GET', null)

        if (!game || !game.activeGame) return null
        game = game.activeGame

        setBet(game.amount)
        setRevealed(game.revealedTiles)
        setMines(game.minesCount)
        game.active = true
        return game
    }

    async function cashout() {
        let res = await authedAPI('/mines/cashout', 'POST', null, true)

        if (res.success) {
            cashoutGame(res)
        }
    }

    async function cashoutGame(res) {
        setGame({
            ...game(),
            payout: res.payout,
            multiplier: res.multiplier,
            active: false,
        })
        cashoutSFX.play()
        setBombs(res.minePositions || [])
        createNotification('success', `You won $R${res.payout} from your mines round!`)
    }

    async function startGame() {
        setGame(null)
        setRevealed([])
        setBombs([])
        setRandom(null)

        let res = await authedAPI('/mines/start', 'POST', JSON.stringify({ amount: bet(), minesCount: mines() }), true)

        if (res.success) {
            setGame({
                amount: bet(),
                multiplier: 1,
                currentPayout: bet(),
                active: true,
            })
            createNotification('success', 'Successfully started a mines round.')
        }
    }

    function randomTile() {
        let tile
        while (!tile || revealed().includes(tile)) {
            tile = Math.floor(Math.random() * 25)
        }
        setRandom(tile)
    }

    function changeBetAmount(amt) {
        let newAmt = Math.max(0, Math.min(props?.user?.balance, bet() + amt))
        if (isNaN(newAmt)) newAmt = 0
        newAmt = Math.floor(newAmt * 100) / 100
        setBet(newAmt)
    }

    return (
        <>
            <Title>BloxClash | Mines</Title>
            <Meta name='title' content='Mines'></Meta>
            <Meta name='description' content='Play Mines On BloxClash And Multiply Your Robux By 100x On The Best Roblox Gaming Platform'></Meta>

            <div class='mines-container fadein'>
                <div className='betting-container'>
                    <div className='betting-header'>
                        <p>BET INTERFACE</p>
                    </div>

                    <div className='inputs'>
                        <div className='input-wrapper'>
                            <div className='input-header'>
                                <p>BET AMOUNT</p>
                            </div>

                            <div className='input-container'>
                                <img src='/assets/icons/coin.svg' height='14' width='14' alt=''/>
                                <input type='number' value={bet()} onInput={(e) => setBet(e.target.valueAsNumber)}
                                       placeholder='0'/>

                                <button class='bevel-light modifier' onClick={() => changeBetAmount(-bet() / 2)}>
                                    1/2
                                </button>

                                <button className='bevel-light modifier' onClick={() => changeBetAmount(bet())}>
                                    2X
                                </button>

                                <button className='bevel-light modifier' onClick={() => setBet(props?.user?.balance || 0)}>
                                    MAX
                                </button>
                            </div>
                        </div>

                        <div className='input-wrapper'>
                            <div className='input-header'>
                                <p>AMOUNT OF MINES</p>
                            </div>

                            <div className='input-container'>
                                <input type='number' value={mines()} onInput={(e) => setMines(e.target.valueAsNumber)}
                                       placeholder='0'/>
                            </div>
                        </div>

                        {game()?.active && (
                            <div class='current-stats'>
                                <div class='current-cashout gold-bg'>
                                    <div class='coin-prefix'>
                                        <img src='/assets/icons/coin.svg' height='16' width='18' alt=''/>
                                    </div>
                                    <p>{formatNumber(game()?.currentPayout || 0)}</p>
                                </div>

                                <div class='current-multi gold-bg'>
                                    <p>{formatNumber(game()?.multiplier || 0)}x</p>
                                </div>
                            </div>
                        )}

                        <button className={'bevel-gold bet ' + (game()?.active ? 'active' : '')} onClick={async () => {
                            if (isProcessing() || !props.user) return
                            setIsProcessing(true)

                            if (!game() || !game().active) {
                                await startGame()
                            } else {
                                await cashout()
                            }

                            setIsProcessing(false)
                        }}>
                            {game()?.active ? 'CASHOUT' : 'PLACE BET'}
                        </button>

                        {game()?.active && (
                            <button className='bevel-light random' onClick={() => randomTile()}>
                                RANDOM TILE
                            </button>
                        )}
                    </div>
                </div>

                <div class='mines-content'>
                    <div className='mines-header'>
                        <img src='/assets/icons/mines.svg' height='14' width='14' alt=''/>
                        <p>MINES</p>
                    </div>

                    {game() && !game().active && (
                        <div class={'summary ' + (game().payout ? 'win' : 'loss')}>
                            <p>{game()?.payout ? 'YOU WON' : 'YOU LOST'}</p>
                            <p class='multi'>{formatNumber(game()?.multiplier || 0)}x</p>
                            <p class='amount-won'><img src='/assets/icons/coin.svg'
                                                           height='18'/> {formatNumber(game()?.payout || -game()?.amount || 0)}</p>
                            <div class='bar' style={{margin: '16px 0'}}/>
                            <button class='try' onClick={() => startGame()}>{game()?.payout ? 'PLAY AGAIN' : 'TRY AGAIN'}</button>
                        </div>
                    )}

                    <div class='mines'>
                        <For each={Array.from(Array(25))}>{(mine, index) =>
                            <Tile index={index()} revealed={revealed()} bombs={bombs()}
                                  game={game()} setGame={setGame} setRevealed={setRevealed} setBombs={setBombs} random={random()}
                                  cashoutGame={cashoutGame}
                            />
                        }</For>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .mines-container {
                width: 100%;
                max-width: 1175px;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;

                display: flex;
                gap: 16px;
              }

              .mines-header {
                width: 100%;
                min-height: 45px;
                height: 45px;
                
                background: #2B2455;
                box-shadow: 0px -1.5px 0px 0px #413972;

                display: flex;
                align-items: center;
                gap: 8px;
                padding: 0 20px;

                color: #FFF;
                font-size: 16px;
                font-weight: 700;
              }

              .mines-content {
                width: 100%;
                max-width: 860px;

                height: 700px;
                max-height: 100%;
                
                border-radius: 16px;
                overflow: hidden;

                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;

                background: linear-gradient(238deg, #242043 0%, #251F4E 100%);
              }
              
              .summary {
                height: fit-content;
                position: absolute;
                z-index: 2;
                
                display: flex;
                flex-direction: column;
                align-items: center;

                width: 100%;
                max-width: 300px;
                padding: 16px;
                
                top: 0; bottom: 0;
                margin: auto;
                
                color: #FFF;
                font-size: 22px;
                font-weight: 700;

                border-radius: 12px;
                border: 1px solid #FF5141;
                background: radial-gradient(139.03% 139.03% at 50% 50%, rgba(255, 81, 65, 0.45) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(0deg, rgba(11, 12, 11, 0.25) 0%, rgba(11, 12, 11, 0.25) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);
                box-shadow: 0px 2px 7px 0px rgba(0, 0, 0, 0.15) inset, 0px 0px 31px 0px rgba(255, 81, 65, 0.56) inset;
              }
              
              .summary.win {
                border: 1px solid #59E878;
                background: radial-gradient(139.03% 139.03% at 50% 50%, rgba(0, 255, 26, 0.45) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(0deg, rgba(11, 12, 11, 0.25) 0%, rgba(11, 12, 11, 0.25) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);
                box-shadow: 0px 2px 7px 0px rgba(0, 0, 0, 0.15) inset, 0px 0px 31px 0px rgba(10, 182, 47, 0.56) inset;
              }
              
              .amount-won {
                color: #FFF;
                font-size: 18px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .bar {
                background: linear-gradient(90deg, rgba(217, 217, 217, 0.00) 0%, #FF5141 47.26%, rgba(217, 217, 217, 0.00) 95.02%); 
                height: 1px; 
                width: 100%;
                max-width: 210px;
              }
              
              .win .bar {
                background: linear-gradient(90deg, rgba(217, 217, 217, 0.00) 0%, #59E878 47.26%, rgba(217, 217, 217, 0.00) 95.02%);
              }
              
              .multi {
                font-size: 18px;
              }
              
              .win .multi {
                background: linear-gradient(213deg, #59E878 31.52%, #88FFA2 51.19%, #29D64E 64.47%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              
              .loss .multi {
                color: #FF5141;
              }
              
              .try {
                border: unset;
                outline: unset;

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 16px;
                font-weight: 700;
                
                padding: 0 16px;
                
                border-radius: 4px;
                background: #FF5141;
                box-shadow: 0px 1px 0px 0px #97352C, 0px -1px 0px 0px #FF8A80;
                height: 30px;
                
                cursor: pointer;
              }
              
              .win .try {
                color: #16412D;
                background: #59E878;
                box-shadow: 0px 1px 0px 0px #2A883E, 0px -1px 0px 0px #78FF95;
              }
              
              .mines {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                grid-gap: 16px;
                padding: 24px;
                
                margin: auto 0;
                
                width: 100%;
                max-width: 650px;
                overflow: hidden;
              }

              .betting-container {
                min-width: 275px;
                width: 275px;
                
                height: 700px;
                max-height: 100%;

                display: flex;
                flex-direction: column;
                gap: 15px;

                border-radius: 16px;
                background: linear-gradient(277deg, #242043 -69.8%, #251F4E 144.89%);
                overflow: hidden;
              }
              
              .betting-header {
                width: 100%;
                height: 40px;

                color: #ADA3EF;
                font-size: 13px;
                font-weight: 700;
                line-height: 40px;
                text-align: center;
                
                background: #1E1A3A;
              }

              .betting-options {
                display: flex;
                width: 100%;
              }

              .betting-option {
                outline: unset;
                border: unset;

                flex: 1 1 0;
                height: 43px;
                line-height: 43px;
                text-align: center;

                background: #413976;
                box-shadow: 0px 1px 0px 0px #1B1734, 0px -1px 0px 0px #5B509E;

                font-family: "Geogrotesque Wide", sans-serif;
                color: #ADA3EF;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
              }

              .betting-option.active {
                color: white;
                background: #1E1A3A;
                box-shadow: unset;
              }

              .inputs {
                display: flex;
                flex-direction: column;
                padding: 0 10px;
                gap: 15px;
              }

              .input-wrapper {
                border-radius: 3px;
                overflow: hidden;
              }

              .input-header {
                width: 100%;
                height: 30px;
                background: #413976;

                color: #9F9AC8;
                font-size: 12px;
                font-weight: 700;

                display: flex;
                align-items: center;
                gap: 8px;
                padding: 0 10px;
              }

              .input-container {
                height: 40px;
                border-radius: 0px 0px 3px 3px;
                border: 1px solid #3E3771;
                background: #1F1A3C;

                display: flex;
                align-items: center;
                gap: 8px;
                padding: 5px 10px;
              }

              .modifier {
                height: 100%;
                color: #9F9AC8;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 12px;
                font-weight: 700;
              }

              input {
                width: 100%;
                height: 100%;
                border: unset;
                outline: unset;
                background: unset;
                color: white;

                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 14px;
                font-weight: 700;
              }

              .bet, .random {
                height: 40px;
                transition: all .3s;
              }
              
              .random {
                height: 40px;
                font-weight: 700;

                background: #413976;
                box-shadow: 0px 2px 0px 0px #1B1734, 0px -2px 0px 0px #5B509E;
              }
              
              .random:active {
                box-shadow: unset;
              }

              .bet.active {
                outline: unset;
                box-shadow: unset;

                border-radius: 3px;
                border: 1px solid #FCA31E;
                background: rgba(252, 163, 30, 0.25);

                color: #FCA31E;
              }
              
              .current-stats {
                display: flex;
                min-height: 40px;
                gap: 8px;
              }
              
              .current-cashout {
                flex: 1;
                height: 100%;
                padding: 0 8px;
                
                display: flex;
                gap: 8px;
                align-items: center;

                color: #FFF;
                font-size: 14px;
                font-weight: 700;
              }
              
              .coin-prefix {
                border-radius: 6px;
                border: 1px solid #B17818;
                background: linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);
              
                height: 30px;
                width: 30px;
                
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .current-multi {
                height: 100%;
                padding: 0 12px;

                color: #FFF;
                font-size: 14px;
                font-weight: 700;
                line-height: 40px;
              }
              
              .gold-bg {
                border-radius: 6px;
                background: linear-gradient(180deg, rgba(177, 120, 24, 0.5), rgba(156, 99, 15, 0.3), rgba(126, 80, 12, 0.25), rgba(102, 65, 10, 0.3), rgba(177, 120, 24, 0.5), rgba(255, 220, 24, 0.5), rgba(255, 220, 24, 0.4));
                position: relative;
                z-index: 0;
              }
              
              .gold-bg:before {
                position: absolute;
                top: 1px;
                left: 1px;
                content: '';
                z-index: -1;

                border-radius: 6px;
                width: calc(100% - 2px);
                height: calc(100% - 2px);

                background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);
              }
              
              .current-multi p {
                background: linear-gradient(53deg, #F90 54.58%, #F9AC39 69.11%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }

              @keyframes pulse {
                0% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.05);
                }
                100% {
                  transform: scale(1);
                }
              }

              @media only screen and (max-width: 1000px) {
                .mines-container {
                  padding-bottom: 90px;
                }
              }

              @media only screen and (max-width: 800px) {
                .mines-container {
                  flex-direction: column;
                }
                
                .betting-container {
                  width: 100%;
                  gap: 0;
                  height: fit-content;
                }
                
                .inputs {
                  padding: 16px 10px;
                }
              }

              @media only screen and (max-width: 600px) {
                .mines {
                  grid-gap: 12px;
                }
              }
            `}</style>
        </>
    );
}

export default Mines;
