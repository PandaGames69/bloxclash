import GreenCount from "../Count/greencount";
import {createEffect, createSignal, For} from "solid-js";
import Avatar from "../Level/avatar";
import {getCents} from "../../util/balance";
import {A, useNavigate} from "@solidjs/router";
import {authedAPI} from "../../util/api";
import ActiveGame from "../Loader/activegame";

function BattlePreview(props) {

  const navigate = useNavigate()
  const [state, setState] = createSignal('waiting')

  createEffect(() => {
    if (state() === 'finished') return
    if (!props?.battle?.startedAt) return setState('waiting')
    if (!props?.battle?.endedAt) return setState('rolling')
    setState('finished')
  })

  function getType() {
    if (props?.battle?.gamemode === 'group') return 'Group'
    if (props?.battle?.playersPerTeam === 2 && props?.battle?.teams === 2) return '2v2'
    if (props?.battle?.playersPerTeam === 1 && props?.battle?.teams === 4) return '1v1v1v1'
    if (props?.battle?.playersPerTeam === 1 && props?.battle?.teams === 3) return '1v1v1'
    if (props?.battle?.playersPerTeam === 1 && props?.battle?.teams === 2) return '1v1'
    return Array(props?.battle?.teams).map(e => props?.battle?.playersPerTeam).join('v')
  }

  function getColor(team) {
    if (props?.battle?.gamemode !== 'group' && props?.battle?.playersPerTeam === 2) return team === 0 ? 'blueteam' : 'yellowteam'
    return 'purple'
  }

  function getCase(id) {
    return props?.battle?.cases?.find(c => id === c.id)
  }

  function getFirstAvailableSlot() {
    return props?.battle?.players?.findIndex(u => u === null) + 1
  }

  function hasLost(index) {
    return (index + 1) !== props?.battle?.winnerTeam && state() === 'finished'
  }

  return (
    <>
      {props?.battle && (
        <div class='battle-preview-container'>

          <div class={'mode ' + (props?.battle?.gamemode === 'group' ? 'group' : '')}>
            {props?.battle?.gamemode === 'group' && (
              <img src='/assets/icons/hands.svg' height='14' alt=''/>)}
            <p>{getType()}</p>
          </div>

          {props?.battle?.gamemode === 'crazy' && (
            <div class='crazy'>
              <img src='/assets/icons/crazy.svg' height='14' alt=''/>
              <p>CRAZY</p>
            </div>
          )}

          {props?.battle?.ownerFunding > 0 && (
            <div className='funding'>
              <p>-{props?.battle?.ownerFunding}%</p>
            </div>
          )}

          <div class='left'>
            <GreenCount number={props?.battle?.rounds?.length} active={state() === 'rolling'}
                        css={{height: '30px', padding: '0 10px'}}/>

            <div class='teams'>
              <For each={new Array(props?.battle?.teams)}>{(t, teamIndex) => (
                <>
                  <div class={'team ' + (hasLost(teamIndex()) ? 'lum' : '')}>
                    <For each={new Array(props?.battle?.playersPerTeam)}>{(p, playerIndex) => {
                      let player = props?.battle?.players[playerIndex() + (teamIndex() * props?.battle?.playersPerTeam)]
                      return (
                        <>
                          <Avatar height={44} xp={getColor(teamIndex())}
                                  id={player?.id || '?'}/>
                          {(props?.battle?.gamemode === 'group' && playerIndex() < props?.battle?.playersPerTeam - 1) && (
                            <img src='/assets/icons/goldhands.svg' height='18' width='18'
                                 alt='vs'/>
                          )}
                        </>
                      )
                    }}</For>
                  </div>

                  {teamIndex() < props?.battle?.teams - 1 && (
                    <img src='/assets/icons/battles.svg' height='16' width='16' alt='vs'/>
                  )}
                </>
              )}</For>
            </div>
          </div>

          <div class='cases'>
            <For each={props?.battle?.rounds}>{(c, index) => (
              <img src={`${import.meta.env.VITE_SERVER_URL}${getCase(c?.caseId)?.img}`} height='80'
                   alt=''/>
            )}</For>
          </div>

          <div class='right'>
            <div class='cost'>
              <img src='/assets/icons/coin.svg' height='15'/>
              <p>{Math.floor(props?.battle?.entryPrice) || '0'}<span
                class='gray'>.{getCents(props?.battle?.entryPrice)}</span></p>
            </div>

            <div class='controls'>
              {state() === 'rolling' && (
                <ActiveGame/>
              )}

              {!props?.battle?.startedAt && !props?.hasJoined && (
                <button class='bevel-gold join' onClick={async () => {
                  let res = await authedAPI(`/battles/${props?.battle?.id}/join`, 'POST', JSON.stringify({
                    slot: getFirstAvailableSlot(),
                    privKey: props?.battle?.privKey
                  }), true)

                  if (res.success) {
                    let link = `/battle/${props?.battle?.id}`
                    if (props?.battle?.privKey) {
                      link += `?pk=${props?.battle?.privKey}`
                    }

                    props?.ws?.emit('battles:subscribe', props?.battle?.id, props?.battle?.privKey)
                    navigate(link)
                  }
                }}>JOIN</button>
              )}

              <button class='bevel-light view'>
                <A href={`/battle/${props.battle.id}${props?.battle?.privKey ? `?pk=${props?.battle?.privKey}` : ''}`}
                   class='gamemode-link'></A>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="8" viewBox="0 0 13 8"
                     fill='#ADA3EF'>
                  <path
                    d="M6.5 0C4.01621 0 1.76378 1.3589 0.101718 3.56612C-0.0339061 3.74696 -0.0339061 3.99959 0.101718 4.18042C1.76378 6.3903 4.01621 7.74921 6.5 7.74921C8.98379 7.74921 11.2362 6.3903 12.8983 4.18308C13.0339 4.00225 13.0339 3.74962 12.8983 3.56878C11.2362 1.3589 8.98379 0 6.5 0ZM6.67817 6.60305C5.02941 6.70676 3.66784 5.34786 3.77156 3.69643C3.85665 2.33487 4.96026 1.23126 6.32183 1.14616C7.97059 1.04245 9.33216 2.40135 9.22844 4.05278C9.14069 5.41168 8.03708 6.51529 6.67817 6.60305ZM6.59573 5.34254C5.70753 5.39838 4.97356 4.66708 5.03206 3.77887C5.07727 3.0449 5.67296 2.45188 6.40692 2.40401C7.29513 2.34816 8.0291 3.07947 7.97059 3.96768C7.92273 4.70431 7.32704 5.29733 6.59573 5.34254Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .battle-preview-container {
          width: 100%;
          height: 90px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          padding: 0 15px;

          position: relative;

          background: rgba(90, 84, 153, 0.27);
        }

        .left {
          display: flex;
          align-items: center;
          gap: 20px;
          min-width: 355px;
        }

        .teams {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .team {
          display: flex;
          align-items: center;
          gap: 8px;

          transition: all .3s;
        }

        .lum {
          filter: grayscale(1);
          mix-blend-mode: luminosity;
          opacity: 0.3;
        }

        .cases {
          flex: 1;
          height: 100%;
          background: rgba(0, 0, 0, 0.3);
          max-width: 440px;

          display: flex;
          align-items: center;
          padding: 0 5px;
          gap: 5px;

          overflow-x: auto;
          scrollbar-color: rgba(173, 163, 239, 0.29) rgba(0, 0, 0, 0.21);
        }

        .cases::-webkit-scrollbar {
          height: 3px;
        }

        .cases::-webkit-scrollbar-track {
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.21);
        }

        .cases::-webkit-scrollbar-thumb {
          border-radius: 10px;
          background: rgba(173, 163, 239, 0.29);
        }

        .right {
          display: flex;
          margin-left: auto;
          gap: 30px;
        }

        .cost {
          height: 30px;
          padding: 0 10px;
        }

        .controls {
          display: flex;
          justify-content: flex-end;
          min-width: 115px;
          gap: 8px;
        }

        .join {
          height: 30px;
          width: 75px;
        }

        .view {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 30px;
          width: 30px;
          position: relative;
        }

        .mode, .crazy, .funding {
          width: 70px;
          height: 30px;
          position: absolute;
          top: -15px;
          left: 0;
          background: url("/assets/art/stripes.png"), #262247;
          background-size: cover;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 5px;

          color: #8E8ABD;
          font-size: 13px;
          font-weight: 700;
        }

        .mode.group {
          color: #FFF;
          background: url("/assets/art/stripes.png"), linear-gradient(0deg, rgba(89, 232, 120, 0.25) 0%, rgba(89, 232, 120, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
        }

        .mode p, .crazy p {
          margin-top: -2px;
        }

        .crazy {
          left: 80px;
          color: #FFF;
          background: url("/assets/art/stripes.png"), #69452B;
        }

        .funding {
          left: unset;
          top: -5px;
          right: 0;
          z-index: 0;
          background: unset;

          height: 20px;
          width: auto;
          padding: 0 8px;

          font-size: 10px;
        }

        .funding:before {
          position: absolute;
          content: '';
          top: 0;
          left: 0;

          z-index: -1;

          width: 100%;
          height: 100%;

          background: linear-gradient(240deg, rgba(0, 255, 194, 0.44) 20.27%, rgba(0, 231, 170, 0.22) 37.12%, rgba(0, 218, 157, 0.10) 56.46%, rgba(0, 195, 134, 0.26) 88.22%, rgba(0, 170, 109, 0.44) 107.96%), linear-gradient(90deg, rgba(156, 255, 172, 0.25) -12.6%, rgba(0, 181, 156, 0.25) 95.75%), linear-gradient(251deg, #1A0E33 -26.07%, #423C7A 190.03%);
          border-radius: 3px;
          border: 1px solid #5EE1A6;

          transform: skew(-10deg);
        }

        .funding p {
          background: linear-gradient(90deg, #64FF7D 0%, #01FFDC 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </>
  );
}

export default BattlePreview;
