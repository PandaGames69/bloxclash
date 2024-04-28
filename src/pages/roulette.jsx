import {createEffect, createSignal, For} from "solid-js";
import RouletteSpinner from "../components/Roulette/roulettespinner";
import RouletteIcon from "../components/Roulette/rouletteicons";
import {useWebsocket} from "../contexts/socketprovider";
import {numberToColor} from "../util/roulettehelpers";
import RouletteBetControls from "../components/Roulette/betcontrols";
import RouletteColor from "../components/Roulette/roulettecolor";
import {subscribeToGame, unsubscribeFromGames} from "../util/socket";
import {Meta, Title} from "@solidjs/meta";

function Roulette(props) {

    let hasConnected = false
    let bar

    const [bets, setBets] = createSignal([])
    const [bet, setBet] = createSignal(0)
    const [timeLeft, setTimeLeft] = createSignal(10000)
    const [config, setConfig] = createSignal({ rollTime: 5000, betTime: 10000 })
    const [round, setRound] = createSignal(null)
    const [last10, setLast10] = createSignal([])
    const [state, setState] = createSignal('')

    const [last100, setLast100] = createSignal([])
    const [stats, setStats] = createSignal({
        green: 0,
        red: 0,
        gold: 0
    })

    const [ws] = useWebsocket()

    createEffect(() => {
        if (ws() && ws().connected && !hasConnected) {
            unsubscribeFromGames(ws())
            subscribeToGame(ws(), 'roulette')
            ws().on('roulette:set', (data) => {
                let stats = { green: 0, red: 0, gold: 0 }
                let last10 = []

                for (let i = 0; i < data.last.length; i++) {
                    let color = numberToColor(data.last[i])
                    stats[color]++

                    if (i < 10) {
                        last10.push(data.last[i])
                    }
                }

                setStats(stats)
                setLast100(data.last)
                setLast10(last10)
                setConfig(data.config)
                setBets(data.bets)

                let timeLeftToRoll = new Date(data.round.createdAt).getTime() + data.config.betTime - Date.now()
                startCountdown(timeLeftToRoll)
            })

            ws().on('roulette:bets', (b) => {
                setBets(bets => [...b, ...bets])
            })

            ws().on('roulette:bet:update', (b) => {
                let curBets = bets()
                let betIndex = curBets?.findIndex(bet => bet.id === b.id)
                if (betIndex < 0) return

                let newBet = curBets[betIndex]
                newBet.amount = b.amount

                setBets([...curBets.slice(0, betIndex), {...newBet}, ...curBets.slice(betIndex + 1)])
            })

            ws().on('roulette:new', (roll) => {
                setBets([])
                setState('')
                startCountdown()
            })

            ws().on('roulette:roll', (roll) => {
                let prev10 = last10()
                let newLast100 = last100()

                newLast100.unshift(roll?.result)
                newLast100 = newLast100.slice(0, 100)

                prev10.unshift(roll?.result)
                prev10 = prev10.slice(0, 10)

                setTimeout(() => {
                    setStats(calculateStats(newLast100))
                    setLast100(newLast100)
                    setLast10(prev10)
                    setState('WINNERS')
                }, 5000)

                setRound(roll)
            })

            hasConnected = true
        }

        if (!ws() || !ws().connected) {
            hasConnected = false
        }
    })

    async function startCountdown(duration = config().betTime) {

        setTimeLeft(Math.max(0, duration))
        let lastDate = Date.now()

        bar.animate([
            {width: '100%'},
            {width: '0%'}
        ], {
            duration: timeLeft(),
            easing: 'linear',
            fill: 'forwards'
        })

        while (timeLeft() > 0) {
            let remaining = Math.max(0, timeLeft() - (Date.now() - lastDate))
            setTimeLeft(remaining)

            lastDate = Date.now()

            await new Promise((resolve) => setTimeout(resolve, Math.min(1000, timeLeft())))
        }
    }

    function calculateStats(history) {
        let stats = { green: 0, red: 0, gold: 0 }

        for (let i = 0; i < history.length; i++) {
            let color = numberToColor(history[i])
            stats[color]++
        }

        return stats
    }

    return (
        <>
            <Title>BloxClash | Roulette</Title>
            <Meta name='title' content='Roulette'></Meta>
            <Meta name='description' content='Bet On Roulette And Win Free Robux on BloxClash! Play On Red, Green And Gold To Win 14x Multiplier'></Meta>

            <div class='roulette-container fadein'>
                <div class='roulette-header'>
                    <p class='desc'>PREVIOUS 10 ROLLS</p>

                    <div class='lastten'>
                        <For each={last10()}>{(round, index) => <RouletteIcon num={round} size='small'/>}</For>
                    </div>

                    <div class='timer-container'>
                        {timeLeft() === 0 ?
                            <p class='rolling'>ROLLING <span class='white'>NOW</span></p>
                            :
                            <p class='rolling'>ROLLING IN <span class='white'>{Math.round(timeLeft() / 1000)}s</span></p>
                        }
                        <div class='timer'>
                            <div class='bar' ref={bar}/>
                        </div>
                    </div>

                    <p class='title'>LAST 100</p>

                    <div class='stats'>
                        <div class='stat'>
                            <p class='desc green'>{stats().green}</p>
                            <RouletteIcon num={1} size='small'/>
                        </div>

                        <div class='stat'>
                            <p class='desc gold'>{stats().gold}</p>
                            <RouletteIcon num={0} size='small'/>
                        </div>

                        <div class='stat'>
                            <p class='desc red'>{stats().red}</p>
                            <RouletteIcon num={14} size='small'/>
                        </div>
                    </div>
                </div>

                <RouletteSpinner roll={round()} config={config()}/>
                <RouletteBetControls bet={bet()} setBet={setBet} user={props.user}/>

                <div class='colors'>
                    <RouletteColor color='green' amount={bet()} bets={bets()} round={round()} state={state()}/>

                    <RouletteColor color='gold' amount={bet()} bets={bets()} round={round()} state={state()}/>

                    <RouletteColor color='red' amount={bet()} bets={bets()} round={round()} state={state()}/>
                </div>
            </div>

            <style jsx>{`
              .roulette-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                padding: 30px 0;
                margin: 0 auto;
              }

              .roulette-header {
                width: 100%;
                display: flex;
                align-items: center;
                position: relative;
                margin: 30px 0;
              }

              .lastten {
                display: flex;
                gap: 10px;
              }

              .desc {
                color: #ADA3EF;
                font-size: 14px;
                font-weight: 700;

                position: absolute;
                top: -25px;
              }

              .rolling {
                color: #ADA3EF;
                font-size: 13px;
                font-weight: 700;
                width: 95px;
              }

              .timer-container {
                display: flex;
                gap: 10px;
                align-items: center;
                margin-left: auto;
              }

              .timer {
                min-width: 132px;
                max-width: 132px;
                width: 132px;
                height: 9px;
                border-radius: 2px;
                background: #242140;
              }

              .bar {
                height: 100%;
                width: 100%;

                border-radius: 2px;
                background: #FCA31E;
              }

              .stats {
                display: flex;
                gap: 15px;
              }

              .stat {
                position: relative;
                display: flex;
                justify-content: center;

                color: #41D164;
              }

              .title {
                color: #ADA3EF;
                font-size: 14px;
                font-weight: 700;
                margin: 0 20px;
              }

              .colors {
                display: flex;
                width: 100%;
                gap: 20px;
              }

              .bet-column {
                flex: 1;
                display: flex;
                flex-direction: column;
              }

              .color {
                color: #FFF !important;
                font-size: 15px;
                font-family: Geogrotesque Wide;
                font-weight: 700;

                outline: unset;
                width: unset;
                border: unset;
                background: unset;

                min-height: 70px;
                padding: 0 20px;

                display: flex;
                align-items: center;
                gap: 20px;
                flex: 1;

                cursor: pointer;
              }

              .color.green {
                border-radius: 7px;
                border: 1px solid #41D163;
                background: rgba(65, 209, 99, 0.25);
                box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.15);
              }

              .color.gold {
                border-radius: 7px;
                border: 1px solid #FF9900;
                background: linear-gradient(37deg, rgba(255, 153, 0, 0.25) 30.03%, rgba(249, 172, 57, 0.25) 42.84%);
                box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.15);
              }

              .color.red {
                border-radius: 7px;
                border: 1px solid #F04B69;
                background: rgba(197, 56, 82, 0.25);
                box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.15);
              }

              .color.red img {
                filter: drop-shadow(0px 0px 15px #C53852);
              }

              .color.green img {
                filter: drop-shadow(0px 0px 15px #41D163);
              }

              .bets-header {
                margin-top: 35px;
                min-height: 30px;
                border-radius: 5px 5px 0 0;
                background: linear-gradient(238deg, #6159B0 0%, #43378D 100%);

                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 15px;
              }

              .win {
                margin-left: auto;
              }

              .green {
                color: #59E878;
              }

              .gold {
                color: var(--gold);
              }

              .red {
                color: #C53852;
              }

              @media only screen and (max-width: 1000px) {
                .roulette-container {
                  padding-bottom: 90px;
                }
              }

              @media only screen and (max-width: 875px) {
                .colors {
                  flex-direction: column;
                  gap: 36px;
                }
              }
            `}</style>
        </>
    );
}

export default Roulette;
