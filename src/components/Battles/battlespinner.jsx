import {authedAPI, getRandomNumber} from "../../util/api"
import {createEffect, createSignal, For, Index} from "solid-js"
import BattleSpinnerItem from "./battlespinneritem"
import {generateRandomItems} from "../../resources/cases"
import Avatar from "../Level/avatar"
import Level from "../Level/level"
import Countup from "../Countup/countup"
import {useNavigate} from "@solidjs/router"
import Chance from 'chance'
import SpinnerDecoration from "./spinnerdecoration";
import SpinnerDiamond from "./spinnerdiamond";

function BattleSpinner(props) {

  let spinner
  let bar

  const [items, setItems] = createSignal([])
  const [offset, setOffset] = createSignal(0)
  const [color, setColor] = createSignal('')
  const navigate = useNavigate()

  function adjacentTeamIsWinner() {
    if (props?.state !== 'WINNERS') return
    return props?.winnerTeam >= props?.index - 1 && props?.winnerTeam < props?.index + 1
  }

  createEffect(() => {
    if (!props?.player) return setColor('')
    if (props.state === 'WAITING' || props?.state === 'EOS') return setColor('gold')
    if (props?.state === 'WINNERS' && props?.team === props?.winnerTeam) return setColor('green')
    if (props?.state === 'WINNERS' && props?.team !== props?.winnerTeam) return setColor('red')
    return setColor('')
  })

  createEffect(() => {
    if (props?.round && props?.state === 'ROLLING') {
      let chanceObj = new Chance(props?.battle?.id + '-' + props?.index)

      let currentRound = props?.rounds[props?.round - 1]
      if (!currentRound) return

      let caseItems = props?.battle?.cases?.find(c => c.id === currentRound.caseId)?.items
      let spinnerItems = generateRandomItems(caseItems, chanceObj)

      let winningId = currentRound?.items[props?.index].itemId
      let winningItem = caseItems?.find(item => winningId === item.id)
      spinnerItems[50] = winningItem

      setItems([...spinnerItems])

      animate()
    }
  })

  function animate() {
    if (!spinner) return

    let chanceObj = new Chance(props?.battle?.id + '-' + props?.round)
    const offset = getRandomNumber(-48, 48, chanceObj)
    const itemsWidth = 100 // 130px + 50px gap
    const itemsGap = 35
    const firstItem = (itemsWidth + itemsGap)
    const lastItem = 49 * (itemsWidth + itemsGap) // 50th item is 49

    spinner.getAnimations().forEach((anim) => {
      anim.pause()
      anim.cancel()
    })

    bar.getAnimations().forEach((anim) => {
      anim.pause()
      anim.cancel()
    })

    spinner.animate(
      {
        transform: [`translatey(-${firstItem}px)`, `translatey(${-lastItem - offset}px)`, `translatey(${-lastItem - offset}px)`, `translatey(-${lastItem}px)`],
        easing: ['cubic-bezier(.05,.85,.3,1)', 'cubic-bezier(.05,.85,.3,1)', 'cubic-bezier(.05,.85,.3,1)', 'cubic-bezier(.05,.85,.3,1)'],
        offset: [0, 0.9, 0.95, 1]
      },
      {
        duration: 5000,
        fill: 'forwards'
      }
    )

    let color = 'linear-gradient(90deg, rgba(249, 81, 81, 0.00) 0%, #F95151 100%)'
    if (props?.roundWinners?.includes(props?.team))
      color = 'linear-gradient(90deg, rgba(89, 232, 120, 0.00) 0%, #59E878 100%)'

    bar.animate(
      {
        background: [color, color, color],
        width: [`0`, '100%', '100%'],
        easing: ['ease', 'ease-out', 'ease-out'],
        offset: [0, 0.7, 1]
      },
      {
        delay: 5000,
        duration: 1500,
      }
    )

    setOffset(offset)
  }

  async function recreateBattle() {
    let res = await authedAPI('/battles/create', 'POST', JSON.stringify({
      cases: props?.battle?.rounds?.map(r => r?.caseId),
      teams: props?.battle?.teams,
      playersPerTeam: props?.battle?.playersPerTeam,
      gamemode: props?.battle?.gamemode,
      funding: props?.creator ? props?.battle?.ownerFunding || 0 : 0,
      minLvl: props?.creator ? props?.battle?.minLevel || 0 : 0,
      isPrivate: props?.creator ? !!props?.battle?.privKey : false,
    }), true)

    if (res.success) {
      let link = `/battle/${res?.battleId}`
      if (res?.privKey) {
        link += `?pk=${res?.privKey}`
      }
      navigate(link)
    }
  }

  async function joinBattle() {
    if (props?.creator) {
      return await authedAPI(`/battles/${props?.battle?.id}/bot`, 'POST', JSON.stringify({
        slot: props.index + 1,
        privKey: props?.battle?.privKey
      }), true)
    }

    await authedAPI(`/battles/${props?.battle?.id}/join`, 'POST', JSON.stringify({
      slot: props.index + 1,
      privKey: props?.battle?.privKey
    }), true)
  }

  return (
    <>
      <div class={'spinner ' + (color())}>

        {props?.state === 'WINNERS' ? (
          <div class='spinner-content user-summary'>
            {color() === 'green' && (
              <div class='winner'>
                <p>WINNER</p>
              </div>
            )}

            <div class='avatar'>
              <Avatar id={props?.player?.id} xp={props?.player?.xp} height='50'/>

              {color() === 'green' && (
                <img class='crown' src='/assets/icons/crown.svg' height='31' width='50'/>
              )}
            </div>

            <div class='username'>
              <p>{props?.player?.username}</p>
              <Level xp={props?.player?.xp}/>
            </div>

            <div class='cost'>
              <img src='/assets/icons/coin.svg' height='16px' width='16px' alt=''/>
              <p>
                <Countup end={color() === 'green' ? props?.total : 0} duration={1000} steps={30} gray={true}/>
              </p>
            </div>

            {color() === 'green' && (
              <button class='bevel-gold recreate' onClick={() => recreateBattle()}>RE-CREATE BATTLE</button>
            )}
          </div>
        ) : props?.player && props?.state === 'ROLLING' ? (
          <div class='spinner-column red'>
            <div class='spinner-items' ref={spinner}>
              <Index each={items()}>{(item, index) => (
                <BattleSpinnerItem
                  offset={offset()}
                  column={props?.index}
                  round={props?.round}
                  state={props?.state}
                  img={item()?.img}
                  price={item()?.price}
                  index={index}
                  position={props?.index}
                />
              )}</Index>
            </div>
          </div>
        ) : props?.player ? (
          <div class='ready'>
            <img src='/assets/icons/logoswords.png'/>
            <p>READY</p>
          </div>
        ) : (
          <div class='spinner-content waiting'>
            <img src='/assets/icons/waiting.png' height='50' width='50'/>
            <p>WAITING</p>
            <button class='bevel-gold call' onClick={() => joinBattle()}>{props?.creator ? 'CALL BOT' : 'JOIN BATTLE'}</button>
          </div>
        )}

        <SpinnerDecoration type={props?.index === 0 ? 'right-dec' : 'left-dec'} color={color()}/>

        {props?.index !== 0 && props?.index < props?.max && (
          <SpinnerDecoration type='right-dec' color={color()}/>
        )}

        <SpinnerDiamond
          index={props?.index}
          teams={props?.battle?.teams}
          startOfTeam={props?.startOfTeam}
          team={props?.team}
          gamemode={props?.battle?.gamemode}
          adjacentTeamIsWinner={adjacentTeamIsWinner()}
        />

        <div class='bar' ref={bar}/>
      </div>

      <style jsx>{`
        .spinner {
          flex: 1;
          height: 375px;
          position: relative;
          z-index: 0;

          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;

          background: linear-gradient(230deg, rgba(26, 14, 51, 0.10) 0%, rgba(66, 60, 122, 0.10) 100%), #403B73;
        }

        .spinner.gold:before {
          position: absolute;
          top: 0;
          left: 0;
          content: '';
          width: 100%;
          height: 100%;
          opacity: 0.15;
          border-radius: 10px;
          background-image: url("/assets/icons/battlestripes.png");
        }

        .spinner.green {
          background: radial-gradient(113.84% 101.60% at 50.00% 100.00%, rgba(89, 232, 120, 0.24) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(230deg, rgba(26, 14, 51, 0.10) 0%, rgba(66, 60, 122, 0.10) 100%), #403B73;
          border-bottom: 2px solid #59E878;
        }

        .spinner.red {
          background: radial-gradient(113.84% 101.60% at 50.00% 100.00%, rgba(249, 81, 81, 0.24) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(230deg, rgba(26, 14, 51, 0.10) 0%, rgba(66, 60, 122, 0.10) 100%), #403B73;
          border-bottom: 2px solid #F95151;
        }

        .gold {
          background: radial-gradient(113.84% 101.60% at 50.00% 100.00%, rgba(252, 163, 30, 0.24) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(230deg, rgba(26, 14, 51, 0.10) 0%, rgba(66, 60, 122, 0.10) 100%), #403B73;
        }

        .ready {
          display: none;
        }

        .gold .ready {
          display: block;
          text-align: center;
          color: white;
          font-weight: 700;
        }

        .spinner-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;

          color: #9296D6;
          font-size: 18px;
          font-weight: 700;

          position: relative;

          width: 100%;
          height: 100%;
        }

        .waiting img {
          animation: infinite spin 3s;
        }

        .user-summary {
          gap: 12px;
        }

        .cost {
          min-width: 135px;
          height: 30px;
          font-variant-numeric: tabular-nums;
        }

        .winner {
          position: absolute;
          top: 20px;
          left: 20px;

          color: #59E878;
          font-size: 16px;
          font-weight: 700;

          background: conic-gradient(from 180deg at 50% 50%, #59E878 -0.3deg, #459D7B 72.1deg, #407B64 139.9deg, #407C64 180.52deg, #37545C 215.31deg, #3B5964 288.37deg, #59E878 359.62deg, #59E878 359.7deg, #459D7B 432.1deg);
          z-index: 0;

          width: 90px;
          height: 30px;
          border-radius: 3px;

          text-align: center;
          line-height: 30px;
        }

        .winner::after {
          width: calc(100% - 2px);
          height: calc(100% - 2px);
          border-radius: 3px;

          top: 1px;
          left: 1px;

          content: '';
          position: absolute;

          background: linear-gradient(0deg, rgba(89, 232, 120, 0.25), rgba(89, 232, 120, 0.25)), linear-gradient(252.77deg, #1A0E33 -27.53%, #423C7A 175.86%);
          z-index: -1;
        }

        .username {
          color: #FFF;
          font-size: 16px;
          font-weight: 700;

          display: flex;
          gap: 6px;
        }

        .avatar {
          position: relative;
        }

        .crown {
          position: absolute;
          top: -26px;
        }

        .red .username, .red .avatar {
          filter: grayscale(1);
        }

        .red .username {
          opacity: 0.5;
        }

        .red .cost {
          background: linear-gradient(rgba(147, 62, 62, 1), rgba(147, 62, 62, 0.61), rgba(147, 62, 62, 0.49), rgba(147, 62, 62, 0.61), rgba(147, 62, 62, 1), rgba(249, 81, 81, 1));
          position: relative;
          z-index: 0;
        }

        .red .cost:before {
          position: absolute;
          width: calc(100% - 2px);
          height: calc(100% - 2px);
          content: '';
          left: 1px;
          top: 1px;
          background: linear-gradient(0deg, rgba(249, 81, 81, 0.25) 0%, rgba(249, 81, 81, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
          z-index: -1;
        }

        .call {
          width: 147px;
          height: 34px;
        }

        .spinner-column {
          max-width: 240px;
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 0;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          overflow: hidden;
        }

        .spinner-column:before {
          width: 100%;
          height: 100%;
          background-image: url("/assets/icons/battlestripes.png");
          position: absolute;
          z-index: -1;
          content: '';
          opacity: 0.3;
          top: 0;
          left: 0;
        }

        .bar {
          position: absolute;
          width: calc(100% - 8px);
          height: 2px;
          bottom: 0;
          overflow: hidden;
          border-radius: 2525px;
          left: 0;
        }

        .spinner-items {
          height: 100%;

          display: flex;
          flex-direction: column;
          gap: 35px;

          position: absolute;
          top: 0px;
        }

        .recreate {
          max-width: 165px;
          width: 100%;
          height: 35px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          90% {
            transform: rotate(360deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media only screen and (max-width: 1040px) {
          .spinner {
            width: 100%;
            min-height: 375px;
            height: 375px;
          }
        }
      `}</style>
    </>
  );
}

export default BattleSpinner;
