import Level from "../Level/level";
import {getCents} from "../../util/balance";
import {authedAPI, getRandomNumber} from "../../util/api";
import {createEffect, createSignal} from "solid-js";

function CoinflipModal(props) {

  createEffect(() => {
    setOpponent(props?.cf[opponentCoin])

    if (props?.cf?.winnerSide && !animation()) {
      const randomAnimation = getRandomNumber(1, 3)
      setAnimation(props?.cf?.winnerSide + randomAnimation)
      setIsSpinning(true)

      setTimer(5)
      let int = setInterval(() => {
        setTimer((t) => t - 1)
        if (timer() <= 0) {
          clearInterval(int)
        }
      }, 1000)
    }
  })

  const opponentCoin = props?.cf?.ownerSide === 'fire' ? 'ice' : 'fire'
  const creator = props?.cf[props?.cf?.ownerSide]
  const [opponent, setOpponent] = createSignal(props?.cf[opponentCoin])
  const [animation, setAnimation] = createSignal(null)
  const [isSpinning, setIsSpinning] = createSignal(false)
  const [timer, setTimer] = createSignal(-1)

  function isLoser(side) {
    if (!props?.cf?.endsAt || timer() > 0 || isSpinning() || (props?.time < props?.cf?.endsAt)) return false
    return side !== props?.cf?.winnerSide
  }

  return (
    <>
      <div class='modal fadein' onClick={() => props.close()}>
        <div class='coinflip-container' onClick={(e) => e.stopPropagation()}>
          <div class='header'>
            <div class='user'>
              <div class={'name '+ (isLoser(props?.cf?.ownerSide) ? 'loser' : '')} style={{margin: '0 auto 0 0'}}>
                <p>{creator?.username}</p>
                <Level xp={creator?.xp}/>
              </div>

              <div class='avatar-container'>
                <img class={'avatar ' + (isLoser(props?.cf?.ownerSide) ? 'gray' : '')} src={`${import.meta.env.VITE_SERVER_URL}/user/${creator?.id}/img`}
                     height='90' width='90' alt=''/>

                <img class={'coin ' + (isLoser(props?.cf?.ownerSide) ? 'gray' : '')} src={`/assets/icons/${props?.cf?.ownerSide}coin.svg`} height='35' width='35'
                     alt={props?.cf?.ownerSide}/>
              </div>

              <p class={'percent ' + (isLoser(props?.cf?.ownerSide) ? 'loser' : '')}>
                {opponent() ? '50.00%' : '100.00%'}
              </p>
            </div>

            <div class='center'>
              {animation() && timer() > 0 ? (
                <p>{timer()} s</p>
              ) : animation() ? (
                <video class='anim' src={`/assets/animations/${animation()}.webm`}
                       autoPlay={true} onEnded={() => setIsSpinning(false)}></video>
              ) : null}
            </div>

            <div class='user'>
              <p class={'percent ' + + (isLoser(opponentCoin) ? 'loser' : '')}>
                {opponent() ? '50.00%' : '...'}
              </p>

              <div class='avatar-container'>
                {opponent() ? (
                  <img class={'avatar ' + (isLoser(opponentCoin) ? 'gray' : '')} src={`${import.meta.env.VITE_SERVER_URL}/user/${opponent().id}/img`}
                       height='90' width='90' alt=''/>
                ) : (
                  <p class='nouser'>?</p>
                )}

                <img class={'coin left ' + (isLoser(opponentCoin) ? 'gray' : '')} src={`/assets/icons/${opponentCoin}coin.svg`} height='35'
                     width='35' alt={opponentCoin}/>
              </div>

              <div class={'name ' + (isLoser(opponentCoin) ? 'loser' : '') } style={{margin: '0 0 0 auto'}}>
                {opponent() ? (
                  <>
                    <Level xp={opponent()?.xp || 0}/>
                    <p>{opponent()?.username}</p>
                  </>
                ) : (
                  <p>Waiting...</p>
                )}
              </div>
            </div>
          </div>

          <div class='user-items'>
            <div class='items' style={{background: 'rgba(0,0,0,0.21)'}}>
              <div class={'robux-container ' + (isLoser(props?.cf?.ownerSide) ? 'loser' : '')}>
                <p>Robux</p>

                <div class='coin-container'>
                  <img class='spiral' src='/assets/icons/goldspiral.png' height='90'
                       width='90'/>
                  <img src='/assets/icons/coin.svg' height='64' width='71'/>
                </div>

                <div class='cost'>
                  <img src='/assets/icons/coin.svg' height='15'/>
                  <p>{Math.floor(props?.cf?.amount)?.toLocaleString(undefined, {maximumFractionDigits: 0}) || '0'}<span
                    class='gray'>.{getCents(props?.cf?.amount)}</span></p>
                </div>
              </div>
            </div>

            {opponent() ? (
              <div class='items'>
                <div class={'robux-container ' + (isLoser(opponentCoin) ? 'loser' : '') }>
                  <p>Robux</p>

                  <div class='coin-container'>
                    <img class='spiral' src='/assets/icons/goldspiral.png' height='90'
                         width='90'/>
                    <img src='/assets/icons/coin.svg' height='64' width='71'/>
                  </div>

                  <div class='cost'>
                    <img src='/assets/icons/coin.svg' height='15'/>
                    <p>{Math.floor(props?.cf?.amount)?.toLocaleString(undefined, {maximumFractionDigits: 0}) || '0'}<span
                      class='gray'>.{getCents(props?.cf?.amount)}</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <div class='items waiting'>
                <div class='join-container'>
                  Waiting for a user to join...
                  <button class='bevel-gold join' onClick={async () => {
                    if (creator.id === props?.user?.id)
                      return await authedAPI(`/coinflip/${props?.cf?.id}/bot`, 'POST', null, true)

                    await authedAPI(`/coinflip/${props?.cf?.id}/join`, 'POST', null, true)
                  }}>
                    {creator.id === props?.user?.id ? (
                      'CALL BOT'
                    ) : 'JOIN COINFLIP'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div class='footer'>
            <p class='seed'>
              <span class='gold bold'>SERVER SEED{!props?.cf?.winnerSide && ' HASH'}:</span> {props?.cf?.serverSeed}
            </p>

            <p>
              <span class='gold bold'>Game ID:</span> {props?.cf?.id}
            </p>

            <button class='bevel-light close' onClick={() => props.close()}>CLOSE</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal {
          position: fixed;
          top: 0;
          left: 0;

          width: 100vw;
          height: 100vh;

          background: rgba(24, 23, 47, 0.55);
          cubic-bezier(0, 1, 0, 1);

          display: flex;
          align-items: center;
          justify-content: center;

          z-index: 1000;
        }

        .coinflip-container {
          max-width: 940px;
          width: 100%;
          height: 100%;
          min-height: 340px;
          max-height: 540px;
          background: #2C2952;

          display: flex;
          flex-direction: column;

          border-radius: 16px;
        }

        .header {
          border-radius: 15px 15px 0 0;
          background: #322F5F;
          width: 100%;
          height: 70px;
          min-height: 70px;

          display: flex;
          align-items: center;
          gap: 20px;

          position: relative;

          padding: 0 35px;
        }

        .user {
          display: flex;
          align-items: center;
          gap: 15px;

          flex-grow: 1;

          overflow: hidden;
        }

        .center {
          min-width: 165px;
          max-width: 165px;
          height: 165px;
          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: linear-gradient(to right, rgba(252, 163, 30, 0.06), rgba(156, 101, 19, 0.03), rgba(0, 0, 0, 0)), #322F5F;
          filter: drop-shadow(0px 2px 15px rgba(0, 0, 0, 0.08));

          color: #FFF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 26px;
          font-weight: 700;

          overflow: hidden;
        }

        .center.red {
          background: linear-gradient(109deg, rgba(188, 40, 32, 0.37) 0%, rgba(192, 28, 29, 0.37) 19.78%, rgba(0, 0, 0, 0.00) 100%), #232048;
          border: solid #322F5F 10px;
        }

        .avatar-container {
          min-width: 125px;
          height: 125px;
          border-radius: 50%;

          display: flex;
          align-items: flex-end;
          justify-content: center;

          position: relative;

          background: #322F5F;
        }

        .coin {
          position: absolute;
          top: 6px;
          right: 6px;
          border-radius: 50%;
        }

        .coin.left {
          left: 6px;
          right: unset;
        }

        .avatar {
          border-radius: 50%;
        }

        .nouser {
          line-height: 125px;
          color: #4E4A8A;
          font-size: 32px;
          font-weight: 700;
          user-select: none;
        }

        .percent {
          min-width: 60px;
          height: 25px;

          border-radius: 3px;
          background: rgba(90, 84, 153, 0.35);

          color: #ADA3EF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 12px;
          font-weight: 700;

          text-align: center;
          line-height: 25px;
          font-variant-numeric: tabular-nums;
        }

        .name {
          display: flex;
          gap: 6px;

          color: #FFF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 14px;
          font-weight: 700;

        }

        .name p {
          max-width: 65px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-items {
          width: 100%;
          height: 100%;
          max-height: 400px;

          display: flex;
        }

        .items {
          display: grid;
          grid-template-columns: 140px;
          grid-gap: 15px;
          flex: 1;
          overflow-y: scroll;
          padding: 20px;
          height: 100%;

          background: rgba(0, 0, 0, 0.11);
          scrollbar-color: transparent transparent;
        }

        .items.waiting {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .join-container {
          width: 360px;
          height: 100px;

          border-radius: 7px;
          border: 1px solid rgba(82, 76, 147, 0.35);
          background: linear-gradient(228deg, rgba(67, 64, 120, 0.25) 0%, rgba(55, 47, 104, 0.25) 100%);

          color: #ADA3EF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 15px;
          font-weight: 700;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
        }

        .join {
          width: 115px;
          height: 35px;
        }

        .robux-container {
          height: 170px;

          border-radius: 7px;
          border: 1px solid rgba(82, 76, 147, 0.35);
          background: linear-gradient(230deg, rgba(26, 14, 51, 0.26) 0%, rgba(66, 60, 122, 0.26) 100%);

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 15px;

          color: #FCA31E;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 12px;
          font-weight: 700;

          padding: 0 15px;
        }

        .coin-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spiral {
          position: absolute;
        }

        .cost {
          min-height: 30px;
          padding: 0 10px;
        }

        .footer {
          display: flex;
          align-items: center;
          gap: 12px;

          color: #9F9AC8;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 12px;
          font-weight: 500;

          padding: 0 25px;
          flex: 1;
        }

        .seed {
          max-width: 300px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .close {
          font-weight: 700;
          width: 90px;
          height: 30px;

          margin-left: auto;
        }
        
        .loser {
          mix-blend-mode: luminosity;
          opacity: 0.5;
        }
        
        .gray {
          filter: grayscale(1);
        }

        .items::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}

export default CoinflipModal;
