import {useWebsocket} from "../contexts/socketprovider";
import {useUser} from "../contexts/usercontextprovider";
import {createEffect, createSignal, For, onCleanup} from "solid-js";
import Countup from "../components/Countup/countup";
import Graph from "../components/Crash/graph";
import CrashRound from "../components/Crash/round";
import {authedAPI} from "../util/api";
import CrashBet from "../components/Crash/crashbet";
import {subscribeToGame, unsubscribeFromGames} from "../util/socket";
import {Title} from "@solidjs/meta";

function Crash(props) {

  let hasConnected
  let dragon

  const [ws] = useWebsocket()
  const [user] = useUser()

  const [betMode, setBetMode] = createSignal('manual')
  const [animationState, setAnimationState] = createSignal('idle')
  const [multi, setMulti] = createSignal(1)
  const [timer, setTimer] = createSignal(10)
  const [config, setConfig] = createSignal(null)
  const [bets, setBets] = createSignal([])
  const [history, setHistory] = createSignal([])

  const [bet, setBet] = createSignal(null)
  const [cashoutMulti, setCashoutMulti] = createSignal(null)
  const [winInc, setWinInc] = createSignal(null)
  const [lossDec, setLossDec] = createSignal(null)
  const [profitStop, setProfitStop] = createSignal(null)
  const [lossStop, setLossStop] = createSignal(null)
  const [numBets, setNumBets] = createSignal(null)
  const [autoBetting, setAutoBetting] = createSignal(false)
  const [currentProfit, setCurrentProfit] = createSignal(0)

  let timerStart
  let lastTimestamp

  function countdown(timeStamp) {
    if (!timerStart) {
      timerStart = timeStamp
      lastTimestamp = timeStamp
    }

    let elapsed = timeStamp - timerStart
    let deltaTime = Math.floor(timeStamp - lastTimestamp)

    setTimer(t => Math.max(0, t - deltaTime))
    if (timer() <= 0 || elapsed >= 10000) {
      timerStart = null
      lastTimestamp = null
      return
    }
    lastTimestamp = timeStamp
    window.requestAnimationFrame(countdown)
  }

  createEffect(() => {
    if (ws() && ws().connected && !hasConnected) {
      unsubscribeFromGames(ws())
      subscribeToGame(ws(), 'crash')
      ws().on('crash:set', (crash) => {
        setBets(crash.bets)
        setConfig(crash.config)
        setHistory(crash.last)
        setMulti(crash.round.multiplier)

        let start = new Date(crash.round.createdAt).getTime()
        let current = new Date(crash.serverTime).getTime()
        let timeSince = current - start

        if (crash.round.status === 'ended') {
          return setAnimationState('crashed')
        }

        if (timeSince >= 10000) {
          startAnimation(true)
        } else {
          setTimer(Math.floor(10000 - timeSince))
          requestAnimationFrame(countdown)
        }
      })

      ws().on('crash:tick', (tick) => setMulti(tick))

      ws().on('crash:start', () => {
        setTimer(0)
        startAnimation()
      })

      ws().on('crash:new', () => {
        dragon?.getAnimations()?.forEach(anim => anim.cancel())
        setTimer(10000)
        requestAnimationFrame(countdown)
        setAnimationState('idle')
        setMulti(1)
        setBets([])
      })

      ws().on('crash:end', () => {
        setAnimationState('crashed')

        let newHistory = [multi(), ...history()].slice(0, 10)
        setHistory(newHistory)
      })

      ws().on('crash:bets', (newBets) => {
        setBets([...newBets, ...bets()])
      })

      ws().on('crash:cashout', (cashedBet) => {
        let index = bets().findIndex(b => b.id === cashedBet.id)
        if (index < 0) return
        let newBet = {...bets()[index]}
        newBet.cashoutPoint = cashedBet.cashoutPoint
        newBet.winnings = cashedBet.winnings

        setBets([
          ...bets().slice(0, index),
          newBet,
          ...bets().slice(index + 1)
        ])
      })

      hasConnected = true
    }

    hasConnected = !!ws()?.connected
  })

  function startAnimation() {

    setAnimationState('start')
    dragon?.animate([
      {left: '-40px', offset: 0},
      {left: '350px', offset: 1}
    ], {
      delay: 700,
      duration: 300,
      fill: 'forwards'
    })

    setTimeout(() => {
      if (animationState() !== 'crashed')
        setAnimationState('flying')

      dragon?.animate([
        {left: '350px', transform: 'rotate(0deg)', offset: 0},
        {left: '500px', bottom: '80px', transform: 'rotate(-45deg)', offset: 1}
      ], {
        delay: 0,
        duration: 300,
        fill: 'forwards'
      })
    }, 1000)
  }

  function activeBet() {
    return bets().find(bet => bet?.user?.id === user()?.id)
  }

  function getButtonStyle() {
    let bet = activeBet()
    if (!bet || bet?.cashoutPoint || animationState() === 'crashed') return ''
    return 'active'
  }

  onCleanup(() => {
    dragon.getAnimations().forEach(anim => anim.cancel())
    cancelAnimationFrame(countdown)
  })

  return (
    <>
      <Title>BloxClash | Crash</Title>

      <div class='crash-container fadein'>
        <div class='crash-header'>
          <img src='/assets/icons/crash.svg' height='14' width='14' alt=''/>
          <p>CRASH</p>
        </div>

        <div class='crash-content'>
          <div class='betting-container'>
            <div class='betting-options'>
              <button class={'betting-option ' + (betMode() === 'manual' ? 'active' : '')}
                      onClick={() => setBetMode('manual')}>MANUAL
              </button>
              <button class={'betting-option ' + (betMode() === 'auto' ? 'active' : '')}
                      onClick={() => setBetMode('auto')}>AUTO
              </button>
            </div>

            <div class='inputs'>
              <div class='input-wrapper'>
                <div class='input-header'>
                  <p>BET AMOUNT</p>
                </div>

                <div class='input-container'>
                  <img src='/assets/icons/coin.svg' height='14' width='14' alt=''/>
                  <input type='number' value={bet()} onInput={(e) => setBet(e.target.valueAsNumber)}
                         placeholder='0'/>
                </div>
              </div>

              <div class='input-wrapper'>
                <div class='input-header'>
                  <p>X MULTIPLIER</p>
                </div>

                <div class='input-container'>
                  <input type='number' value={cashoutMulti()}
                         onInput={(e) => setCashoutMulti(e.target.valueAsNumber)} placeholder='0'/>
                </div>
              </div>

              {betMode() === 'auto' && (
                <>
                  <div class='split'>
                    <div class='input-wrapper'>
                      <div class='input-header'>
                        <p>% ON WIN</p>
                      </div>

                      <div class='input-container'>
                        <input type='number' value={winInc()}
                               onInput={(e) => setWinInc(e.target.valueAsNumber)}
                               placeholder='0'/>
                      </div>
                    </div>

                    <div class='input-wrapper'>
                      <div class='input-header'>
                        <p>% ON LOSS</p>
                      </div>

                      <div class='input-container'>
                        <input type='number' value={lossDec()}
                               onInput={(e) => setLossDec(e.target.valueAsNumber)}
                               placeholder='0'/>
                      </div>
                    </div>
                  </div>

                  <div class='split'>
                    <div class='input-wrapper'>
                      <div class='input-header'>
                        <p>STOP ON PROFIT</p>
                      </div>

                      <div class='input-container'>
                        <input type='number' value={profitStop()}
                               onInput={(e) => setProfitStop(e.target.valueAsNumber)}
                               placeholder='0'/>
                      </div>
                    </div>

                    <div class='input-wrapper'>
                      <div class='input-header'>
                        <p>STOP ON LOSS</p>
                      </div>

                      <div class='input-container'>
                        <input type='number' value={lossStop()}
                               onInput={(e) => setLossStop(e.target.valueAsNumber)}
                               placeholder='0'/>
                      </div>
                    </div>
                  </div>

                  <div class='input-wrapper'>
                    <div class='input-header'>
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="8" viewBox="0 0 15 8" fill="none">
                        <path
                          d="M11.227 8.17393e-05C10.6813 -0.00352165 10.1415 0.112054 9.64512 0.338735C9.14877 0.565416 8.7079 0.897735 8.35331 1.31248L7.7969 1.95341L9.03886 3.38789L9.77136 2.5427C9.95114 2.33285 10.1745 2.16469 10.4259 2.04995C10.6773 1.93521 10.9506 1.87662 11.227 1.87829C11.4749 1.87436 11.7211 1.91979 11.9513 2.01194C12.1814 2.1041 12.391 2.24113 12.5677 2.41505C12.7444 2.58898 12.8847 2.79632 12.9805 3.02501C13.0763 3.2537 13.1256 3.49916 13.1256 3.7471C13.1256 3.99504 13.0763 4.2405 12.9805 4.46919C12.8847 4.69788 12.7444 4.90522 12.5677 5.07915C12.391 5.25307 12.1814 5.3901 11.9513 5.48225C11.7211 5.57441 11.4749 5.61984 11.227 5.61591C10.9515 5.61773 10.679 5.55944 10.4284 5.44509C10.1778 5.33074 9.95518 5.16309 9.77605 4.95385C7.05594 1.81302 8.34838 3.31042 6.62067 1.31013C6.26561 0.896112 5.82459 0.564439 5.32832 0.338194C4.83204 0.11195 4.29242 -0.00343042 3.74702 8.17393e-05C2.75325 8.17393e-05 1.80018 0.394856 1.09748 1.09756C0.394774 1.80026 0 2.75333 0 3.7471C0 4.74087 0.394774 5.69394 1.09748 6.39664C1.80018 7.09934 2.75325 7.49412 3.74702 7.49412C4.29267 7.49772 4.83252 7.38214 5.32887 7.15546C5.82521 6.92878 6.26608 6.59646 6.62067 6.18172L7.17709 5.54078L5.93512 4.10631L5.20263 4.9515C5.02284 5.16135 4.79949 5.3295 4.5481 5.44425C4.29672 5.55899 4.02335 5.61757 3.74702 5.61591C3.49911 5.61984 3.2529 5.57441 3.02272 5.48225C2.79254 5.3901 2.583 5.25307 2.40629 5.07915C2.22959 4.90522 2.08926 4.69788 1.99347 4.46919C1.89768 4.2405 1.84835 3.99504 1.84835 3.7471C1.84835 3.49916 1.89768 3.2537 1.99347 3.02501C2.08926 2.79632 2.22959 2.58898 2.40629 2.41505C2.583 2.24113 2.79254 2.1041 3.02272 2.01194C3.2529 1.91979 3.49911 1.87436 3.74702 1.87829C4.02246 1.87646 4.29499 1.93476 4.54558 2.04911C4.79617 2.16346 5.0188 2.3311 5.19793 2.54035C7.91804 5.68118 6.6256 4.18378 8.35331 6.18407C8.76046 6.66905 9.28338 7.04348 9.87367 7.27269C10.464 7.50189 11.1025 7.57847 11.7303 7.49533C12.358 7.41218 12.9547 7.17201 13.4649 6.79704C13.9752 6.42207 14.3826 5.92442 14.6495 5.35016C14.9163 4.77591 15.034 4.14361 14.9915 3.51181C14.9491 2.88 14.748 2.26911 14.4067 1.73569C14.0655 1.20227 13.5952 0.763564 13.0394 0.460181C12.4836 0.156799 11.8602 -0.00145119 11.227 8.17393e-05Z"
                          fill="#9F9AC8"/>
                      </svg>
                      <p>TOTAL BETS</p>
                    </div>

                    <div class='input-container'>
                      <input type='number' value={numBets()}
                             onInput={(e) => setNumBets(e.target.valueAsNumber)}
                             placeholder='0'/>
                    </div>
                  </div>
                </>
              )}

              <button class={'bevel-gold bet ' + (getButtonStyle())} onClick={async () => {
                let hasBet = activeBet()

                if (!hasBet) {
                  let res = await authedAPI('/crash/bet', 'POST', JSON.stringify({
                    amount: bet(),
                    autoCashoutPoint: cashoutMulti()
                  }), true)
                } else {
                  let res = await authedAPI('/crash/cashout', 'POST', null, true)
                }
              }}>
                {getButtonStyle() === 'active' ? 'CASHOUT FROM THE DRAGON REALM' : 'ENTER THE DRAGON REALM'}
              </button>
            </div>

            {betMode() === 'manual' && (
              <div class='bets-container'>
                <div class='bets-header'>
                  <p>{bets()?.length} PLAYERS</p>

                  <p class='total gold'>
                    <img src='/assets/icons/coin.svg' height='15' alt=''/>
                    {(bets()?.reduce((pv, bet) => pv + bet.amount, 0))?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>

                <div class='bets'>
                  <For each={bets()}>{(bet) => <CrashBet bet={bet} state={animationState()}/>}</For>
                </div>
              </div>
            )}
          </div>

          <div class={'animation-container ' + (animationState())}>

            <div class='history'>
              <For each={history()}>{(multi) => <CrashRound multi={multi}/>}</For>
            </div>

            <div class='round-info'>
              {animationState() === 'idle' ? (
                <>
                  <p>ENTERING DRAGON REALM</p>
                  <p class='countdown'>
                    Starting IN
                    &nbsp;
                    <span class='white'>
                                    {(timer() / 1000).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}S
                                </span>
                  </p>
                </>
              ) : (
                <>
                  <p>{animationState() === 'crashed' ? 'CRASHED' : 'CURRENT PAYOUT'}</p>
                  <p class='multi'><Countup end={multi()} duration={100} steps={3}
                                            stepDown={false}
                                            init={false}/> x</p>
                </>
              )}
            </div>

            <Graph payout={multi()}/>

            <div class='dragon' ref={dragon}>
              {animationState() === 'idle' ? (
                <video src='/assets/animations/Hold.webm' playsInline autoPlay='autoPlay'
                       loop
                       muted/>
              ) : animationState() === 'start' ? (
                <video src='/assets/animations/Start.webm' playsInline
                       autoPlay='autoPlay'
                       muted/>
              ) : animationState() === 'flying' ? (
                <video src='/assets/animations/Flying.webm' playsInline
                       autoPlay='autoPlay' loop
                       muted/>
              ) : animationState() === 'crashed' ? (
                <video src='/assets/animations/Explode.webm' playsInline autoPlay='autoPlay'
                       muted/>
              ) : null}
            </div>

            {/*<div class='ruler'/>*/}
            <div class='bg'/>
          </div>
        </div>

        <div class='crash-footer'>

        </div>
      </div>

      <style jsx>{`
        .crash-container {
          width: 100%;
          max-width: 1175px;
          height: fit-content;

          box-sizing: border-box;
          padding: 30px 0;
          margin: 0 auto;
        }

        .crash-header {
          width: 100%;
          min-height: 45px;
          height: 45px;

          border-radius: 5px 5px 0px 0px;
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

        .crash-content {
          width: 100%;
          min-height: 575px;
          height: 575px;

          display: flex;

          background: linear-gradient(238deg, #242043 0%, #251F4E 100%);
        }

        .dragon {
          bottom: -40px;
          left: -40px;
          position: absolute;
          z-index: 2;
        }

        .crash-footer {
          width: 100%;
          min-height: 65px;
          height: 65px;

          border-radius: 0px 0px 5px 5px;
          background: #1B1639;
        }

        .betting-container {
          min-width: 275px;
          width: 275px;
          height: 100%;

          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .bets-container {
          width: 100%;
          height: 100%;
          overflow-y: hidden;
          display: flex;
          flex-direction: column;
        }

        .bets-header {
          width: 100%;
          height: 30px;
          min-height: 30px;

          color: #9F9AC8;
          font-size: 12px;
          font-weight: 700;

          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;

          background: linear-gradient(238deg, #48428B 0%, #251F4E 100%);
        }

        .bets {
          overflow-y: scroll;
          height: 100%;
          scrollbar-color: transparent transparent;
        }

        .bets::-webkit-scrollbar {
          display: none;
        }

        .total {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .animation-container {
          width: 100%;
          height: 100%;
          background-image: url('/assets/art/lava.png'), radial-gradient(71.59% 50% at 50% 50%, #210b0b 0, #050114 100%);
          background-size: cover;
          position: relative;
          padding: 10px 120px 10px 50px;
          overflow: hidden;
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

        .split {
          display: flex;
          gap: 8px;
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
          padding: 0 10px;
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

        .bet {
          height: 40px;

          transition: all .3s;
        }

        .bet.active {
          outline: unset;
          box-shadow: unset;

          border-radius: 3px;
          border: 1px solid #FCA31E;
          background: rgba(252, 163, 30, 0.25);

          color: #FCA31E;
        }

        .round-info {
          color: #FFF;
          font-size: 24px;
          font-weight: 700;

          position: relative;
          z-index: 2;
          margin: 70px 0 0 0px;
        }

        .countdown {
          color: #FCA31E;
          font-size: 44px;
          font-weight: 700;
          text-transform: uppercase;
          font-variant-numeric: tabular-nums;
        }

        .multi {
          background: linear-gradient(37deg, #F90 30.03%, #F9AC39 42.84%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          text-shadow: 0px 6px 0px rgba(255, 153, 1, 0.30);
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 84px;
          font-weight: 700;

          font-variant-numeric: tabular-nums;
        }

        .crashed .multi {
          background-clip: unset;
          -webkit-background-clip: unset;
          -webkit-text-fill-color: unset;
          background: unset;

          color: #EC4040;
          text-shadow: 0px 5px 0px #45141B;
        }

        .history {
          width: 100%;
          height: fit-content;
          display: flex;
          overflow: hidden;
          gap: 10px;
          position: relative;
          z-index: 2;
        }

        .ruler {
          background: linear-gradient(238deg, rgba(255, 0, 6, 0.15) 0%, rgba(255, 122, 0, 0.15) 100%), #0F0B21;
          box-shadow: -2px 0px 5px 0px rgba(0, 0, 0, 0.35);
          height: 100%;
          width: 70px;

          position: absolute;
          z-index: 0;
          right: 0;
          top: 0;
        }

        @media only screen and (max-width: 1000px) {
          .crash-container {
            padding-bottom: 90px;
          }
        }
      `}</style>
    </>
  );
}

export default Crash;
