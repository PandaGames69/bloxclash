import {createEffect, createSignal, For} from "solid-js";
import {useWebsocket} from "../contexts/socketprovider";
import {useUser} from "../contexts/usercontextprovider";
import Countup from "../components/Countup/countup";
import JackpotUser from "../components/Jackpot/jackpotuser";
import JackpotBet from "../components/Jackpot/jackpotbet";
import JackpotJoin from "../components/Jackpot/jackpotjoin";
import {generateBets} from "../resources/jackpot";
import Chance from 'chance'
import {getRandomNumber} from "../util/api";
import Level from "../components/Level/level";
import {getCents} from "../util/balance";
import {subscribeToGame, unsubscribeFromGames} from "../util/socket";
import {Meta, Title} from "@solidjs/meta";

function Jackpot(props) {

    let timerBar
    let spinnerRef

    const [ws] = useWebsocket()
    const [user] = useUser()

    const [jackpot, setJackpot] = createSignal(null)
    const [bets, setBets] = createSignal([])
    const [rawBets, setRawBets] = createSignal([])
    const [total, setTotal] = createSignal(0)
    const [join, setJoin] = createSignal(false)
    const [timer, setTimer] = createSignal(-1)
    const [state, setState] = createSignal('waiting')
    const [config, setConfig] = createSignal({})
    const [users, setUsers] = createSignal([])
    const [winner, setWinner] = createSignal(null)
    const [ticket, setTicket] = createSignal(0)

    let hasConnected = false
    let colors = [
        '#FCA31E',
        '#C2FC1E',
        '#FC6E1E',
        '#1EFC92',
        '#EC1507',
        '#1EB9FC',
        '#0073FA',
        '#9E52FF',
        '#69EFAF',
        '#D96DFF',
        '#6B54F9',
        '#A072BC',
        '#EC519B',
        '#F8BA5F',
        '#C6DA8D',
        '#D75E1A',
        '#1CBD70',
        '#54DA25',
        '#1399D2',
        '#5272E2',
    ]

    const timerText = {
        winners: () => '',
        rolling: () => '',
        counting: () => <>
            <img src='/assets/icons/timer.svg' height='18' width='15'/>
            {Math.floor(timer() / 1000) + ' s'}
        </>,
        waiting: () => 'WAITING FOR PLAYERS...'
    }

    const spinnerContent = {
        winners: () => <div class='winner fadein'>
            <JackpotUser color={winner()?.color} id={winner()?.user?.id} percent={winner()?.amount / total()}
                         won={true}/>
            <div>
                <p class='details'>
                    <span class='white bold'>{winner()?.user?.username || 'Anonymous'}</span>
                    <Level xp={winner()?.user?.xp}/>
                    WON
                    <img src='/assets/icons/coin.svg' height='17' width='17'/>
                    <span class='bold white'>
                                        {total()?.toLocaleString(undefined, { maximumFractionDigits: 0 })}<span class='gray'>.{getCents(total())}</span>
                                    </span>
                    WITH A
                    <span class='white'>{(winner()?.amount / total() * 100)?.toFixed(2)}%</span>
                    CHANCE
                </p>

                <p class='ticket'>
                    Winning ticket: {ticket()}
                </p>
            </div>
        </div>,
        rolling: () => <>
            <img class='arrow' src='/assets/icons/selector.png' height='16' alt=''/>
            <div class='spinner' ref={spinnerRef}>
                <For each={users()}>{(bet, index) => <JackpotUser color={bet?.color} id={bet?.user?.id}
                                                                  percent={bet?.amount / total()} state={state()}
                                                                  index={index()}/>}</For>
            </div>
        </>,
        counting: () => <For each={bets()}>{(bet, index) => <JackpotUser color={bet?.color} id={bet?.user?.id}
                                                                         percent={bet?.amount / total()}/>}</For>,
        waiting: () => <For each={bets()}>{(bet, index) => <JackpotUser color={bet?.color} id={bet?.user?.id}
                                                                        percent={bet?.amount / total()}/>}</For>
    }

    createEffect(() => {
        if (ws() && ws().connected && !hasConnected) {
            unsubscribeFromGames(ws())
            subscribeToGame(ws(), 'jackpot')

            ws().off('jackpot:set')
            ws().off('jackpot:bets')
            ws().off('jackpot:on')
            ws().off('jackpot:new')
            ws().off('jackpot:countStart')
            ws().off('jackpot:roll')

            ws().on('jackpot:set', (jp) => {
                congregateBets(jp?.bets)
                setJackpot(jp)
                setConfig(jp?.config)
                setRawBets(jp.bets)

                if (jp.round.countStartedAt) {
                    let countStart = new Date(jp.round.countStartedAt).getTime()
                    let serverTime = new Date(jp.serverTime).getTime()
                    let timeSince = serverTime - countStart

                    if (timeSince < 30000) {
                        let timeLeft = 30000 - timeSince
                        let ends = Date.now() + timeLeft
                        let duration = ends < 1000 ? ends : 1000

                        timerBar.animate([
                            {width: '100%', offset: 0},
                            {width: '0%', offset: 1}
                        ], {
                            duration: timeLeft,
                            fill: 'forwards'
                        })

                        setTimer(timeLeft)
                        setState('counting')
                        let int = setInterval(() => {
                            setTimer(Math.max(0, ends - Date.now()))
                            if (Date.now() > ends) return clearInterval(int)
                        }, duration)
                    }
                }
            })

            ws().on('jackpot:new', (jp) => {
                setTimer(-1)
                setTotal(0)
                setBets([])
                setJackpot(jp)
                setUsers([])
                setRawBets([])
                setState('waiting')
                setWinner(null)
                setTicket(0)
                timerBar.getAnimations().forEach(anim => anim.cancel())
            })

            ws().on('jackpot:bets', (bets) => {
                let newJP = {...jackpot()}

                if (!Array.isArray(newJP.bets)) newJP.bets = []
                newJP.bets.push(...bets)

                congregateBets(newJP.bets)
                setJackpot(newJP)
                setRawBets((b) => [...b, ...bets])
            })

            ws().on('jackpot:countStart', () => {
                timerBar.animate([
                    {width: '100%', offset: 0},
                    {width: '0%', offset: 1}
                ], {
                    duration: config()?.betTime,
                    fill: 'forwards'
                })

                let ends = Date.now() + config()?.betTime
                setState('counting')
                setTimer(30000)

                let int = setInterval(() => {
                    setTimer(Math.max(0, ends - Date.now()))
                    if (Date.now() > ends) return clearInterval(int)
                }, 1000)
            })

            ws().on('jackpot:roll', (roundId, unhashedServerSeed, clientSeed, winnerBetId, ticket) => {
                if (state() === 'rolling') return

                setTicket(ticket)
                let winningBet = rawBets().find(bet => bet.id === winnerBetId)
                let randomBets = generateBets(bets(), total())
                randomBets[50] = winningBet

                let congregatedBet = bets().find(bet => winningBet.user.id === bet.user.id)
                randomBets[50].color = congregatedBet.color
                randomBets[50].amount = congregatedBet.amount
                setWinner(randomBets[50])

                setJackpot({...jackpot(), serverSeed: unhashedServerSeed})
                setUsers(randomBets)
                setState('rolling')
                setTimer(-1)
                rollAnimation(jackpot())
            })

            hasConnected = true
        }

        hasConnected = !!ws()?.connected
    })

    function rollAnimation(jp) {
        let chanceObj = new Chance(jp.serverSeed)

        const itemsWidth = 80
        const center = (itemsWidth / 2)
        const itemsGap = 8
        const firstItem = 9 * (itemsWidth + itemsGap) + center
        const lastItem = 50 * (itemsWidth + itemsGap) + center
        const offset = getRandomNumber(-38, 38, chanceObj)

        spinnerRef.getAnimations().forEach(anim => anim.cancel())

        spinnerRef.animate(
            [
                {left: `calc(50% + -${firstItem}px)`, offset: 0, easing: 'cubic-bezier(.05,.85,.3,1)'},
                {left: `calc(50% + ${-lastItem - offset}px)`, offset: 0.9, easing: 'cubic-bezier(.05,.85,.3,1)'},
                {left: `calc(50% + ${-lastItem - offset}px)`, offset: 0.95, easing: 'cubic-bezier(.05,.85,.3,1)'},
                {left: `calc(50% + -${lastItem}px)`, offset: 1, easing: 'cubic-bezier(.05,.85,.3,1)'}
            ],
            {
                duration: config()?.rollTime || 5000,
                fill: 'forwards'
            })

        window.requestAnimationFrame(showWinner)
    }

    let start

    function showWinner(timeStamp) {
        if (!start) {
            start = timeStamp
        }
        let elapsed = timeStamp - start

        if (elapsed > config()?.rollTime + 2000) {
            start = null
            return setState('winners')
        }
        window.requestAnimationFrame(showWinner)
    }

    function usersBet() {
        if (!user()) return
        return bets()?.find(bet => bet.user.id === user().id)
    }

    function congregateBets(bets) {
        let total = 0
        let combinedUserBets = []

        let color = 0
        bets.forEach((bet) => {
            const userId = bet.user.id
            const existingUserBetIndex = combinedUserBets.findIndex((userBet) => userBet.user.id === userId)

            if (existingUserBetIndex !== -1) {
                combinedUserBets[existingUserBetIndex].amount += bet.amount
            } else {
                combinedUserBets.push({
                    user: bet.user,
                    amount: bet.amount,
                    color: colors[color]
                })
                color++
            }

            total += bet.amount
        })

        setTotal(total)
        setBets(combinedUserBets)
    }

    return (
        <>
            <Title>BloxClash | Jackpot</Title>
            <Meta name='title' content='Jackpot'></Meta>
            <Meta name='description' content='Win Robux & Limiteds On BloxClash In Big Jackpots In Roblox Gaming!'></Meta>

            {join() && (
                <JackpotJoin close={() => setJoin(false)}/>
            )}

            <div class='jackpot-container fadein'>
                <div class='jackpot-header'>
                    <div class='header-section'>
                        <p class='title'>
                            <img src='/assets/icons/coin2.svg' height='18' alt=''/>
                            JACKPOT -
                        </p>
                    </div>

                    <div class='header-section right'>
                        <button class='bevel-gold join' onClick={() => setJoin(true)}>JOIN POT</button>
                    </div>
                </div>

                <div class='bar'/>

                <div class='stats'>
                    <div class='stat'>
                        <p>{((usersBet()?.amount || 0) / (total() || 1) * 100).toFixed(2)}%</p>
                        <p>YOUR CHANCE</p>
                    </div>

                    <div class='stat'>
                        <p>{bets()?.length}</p>
                        <p>TOTAL PLAYERS</p>
                    </div>

                    <div class='stat'>
                        <p class='white align'>
                            <img class='stat-coin' src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                            <Countup end={total()} gray={true}/>
                        </p>

                        <p class='gold'>TOTAL AMOUNT</p>
                    </div>

                    <div class='stat gold'>
                        <p class='white align'>
                            <img class='stat-coin' src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                            <Countup end={usersBet()?.amount || 0} gray={true}/>
                        </p>

                        <p class='gold'>DEPOSITED VALUE</p>
                    </div>
                </div>

                <div class='timer-container'>
                    <div class='timer' ref={timerBar}/>
                    <p>{timerText[state()]}</p>
                </div>

                <div class='users'>
                    {spinnerContent[state()]}
                </div>

                <div class='bets'>
                    <For each={bets()}>{(bet, index) => <JackpotBet {...bet}/>}</For>
                </div>
            </div>

            <style jsx>{`
              .jackpot-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }

              .jackpot-header {
                display: flex;
                justify-content: space-between;
              }

              .header-section {
                display: flex;
                align-items: center;
                flex-grow: 1;
                gap: 15px;
              }

              .right {
                justify-content: flex-end;
              }

              .title {
                color: #FFF;
                font-size: 18px;
                font-weight: 700;

                display: flex;
                align-items: center;
                gap: 8px;
              }

              .join {
                width: 130px;
                height: 35px;
              }

              .bar {
                margin: 25px 0;
                border-radius: 555px;
                background: #5A5499;
                height: 1px;
                flex: 1;
              }

              .stats {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;

                width: 100%;
              }

              .stat {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                gap: 10px;

                flex: 1 1 0;
                height: 90px;

                border-radius: 5px;
                background: rgba(90, 84, 153, 0.27);

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 20px;
                font-weight: 600;

                padding: 10px;
                white-space: nowrap;
              }

              .stat.gold {
                border-radius: 5px;
                background: conic-gradient(from 180deg at 50% 50%, #FFDC18 -0.3deg, #B17818 72.1deg, rgba(156, 99, 15, 0.611382) 139.9deg, rgba(126, 80, 12, 0.492874) 180.52deg, rgba(102, 65, 10, 0.61) 215.31deg, #B17818 288.37deg, #FFDC18 359.62deg, #FFDC18 359.7deg, #B17818 432.1deg);
                backdrop-filter: blur(5px);

                position: relative;
                z-index: 0;
              }

              .stat.gold:before {
                position: absolute;
                top: 1px;
                left: 1px;
                content: '';
                height: calc(100% - 2px);
                width: calc(100% - 2px);
                border-radius: 5px;
                background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
                z-index: -1;
              }

              .stat p:last-child {
                color: #ADA3EF;
                font-size: 13px;
                font-weight: 600;
              }

              .align {
                display: flex;
                align-items: center;
              }

              .stat-coin {
                margin-right: 8px;
              }

              .timer-container {
                width: 100%;
                height: 35px;

                border-radius: 5px;
                border: 1px dashed #534E8F;
                background: linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), linear-gradient(230deg, rgba(26, 14, 51, 0.35) 0%, rgba(66, 60, 122, 0.35) 100%);

                margin: 25px 0;
                position: relative;
                padding: 10px;
              }

              .timer-container p {
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .timer {
                width: 100%;
                height: 100%;
                background: linear-gradient(to right, #403C72 0%, #5E58AC 100%);
              }

              .timer:before {
                position: absolute;
                z-index: -1;
                height: calc(100% - 20px);
                width: calc(100% - 20px);
                content: '';
                top: 10px;
                left: 10px;
                background: #1A0E33;
              }

              .timer-container p {
                position: absolute;
                top: -2px;
                text-align: center;
                left: 50%;
                transform: translateX(-50%);

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 16px;
                font-weight: 700;
                line-height: 35px;
              }

              .users {
                width: 100%;
                height: 100px;

                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;

                border-radius: 5px;
                background: linear-gradient(to right, rgba(0, 0, 0, 0.41) 0%, rgba(0, 0, 0, 0.15) 25%, rgba(0, 0, 0, 0.15) 75%, rgba(0, 0, 0, 0.41) 100%);
                padding: 10px;

                display: flex;
                gap: 8px;

                overflow: hidden;
              }

              .winner {
                display: flex;
                gap: 20px;
                align-items: center;
              }

              .details {
                display: flex;
                gap: 5px;

                color: #ADA3EF;
                font-size: 13px;
                font-weight: 600;
              }

              .ticket {
                margin-top: 10px;

                color: #ADA3EF;
                font-size: 11px;
                font-weight: 600;
              }

              .spinner {
                display: flex;
                gap: 8px;

                position: absolute;
                left: 50%;
              }

              .arrow {
                position: absolute;
                top: -8px;
              }

              .bets {
                width: 100%;
                margin-top: 25px;

                display: flex;
                flex-direction: column;
                gap: 6px;
              }

              @media only screen and (max-width: 1000px) {
                .jackpot-container {
                  padding-bottom: 90px;
                }
              }
            `}</style>
        </>
    );
}

export default Jackpot;
