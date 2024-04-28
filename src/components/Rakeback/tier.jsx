import {authedAPI, createNotification} from "../../util/api";

function RakebackTier(props) {

  function formatTimeLeft() {
    let timeLeft = props?.claimAt - props?.time
    const totalSeconds = Math.floor(timeLeft / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
  }

  async function claimRakeback() {
    if (!props?.active || props?.reward < props?.min) return

    let res = await authedAPI('/user/rakeback/claim', 'POST', JSON.stringify({
      type: props?.tier?.toLowerCase()
    }), true)

    if (res.success) {
      createNotification('success', `Successfully claimed your ${props?.tier} rakeback for a total of ${props?.reward}.`)
      props?.onClaim(props?.tier)
    }
  }

  return (
    <>
      <div className={'period-wrapper ' + (props?.active ? 'active' : '')}>
        <div className='period'>
          <img className='arrows' src='/assets/art/rakebackarrows.png' height='87' width='87'/>
          <p>{props?.period}</p>
        </div>

        <div className='amount' onClick={async () => claimRakeback()}>
          <p>{props?.tier} RAKEBACK</p>
          <p className='claimable'>
            <img src='/assets/icons/coin.svg' height='13' width='12' alt=''/>&nbsp;
            {props?.reward?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </div>

        <div className='claim'>
          <p>{props?.tier} Rakeback</p>

          <div className='diamond'/>

          <div className='timer'>
            <div className='bar'/>
          </div>

          <button class='claim-button' onClick={async () => claimRakeback()}>
            {(props?.reward < props?.min) ?
              `MIN ${props?.min} ROBUX TO CLAIM` : props?.active ? 'CLAIM NOW' : `CLAIM IN ${formatTimeLeft()}`}
          </button>
        </div>
      </div>

      <style jsx>{`
        .period-wrapper {
          flex: 1;
          
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 25px;

          color: rgba(173, 163, 239, 1);
          font-size: 12px;
          font-weight: 700;
        }
        
        .active.period-wrapper {
          color: var(--gold);
        }
        
        .period {
          width: 80px;
          height: 80px;
          
          display: flex;
          align-items: center;
          justify-content: center;
          
          border-radius: 50%;
          
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), linear-gradient(253deg, rgba(26, 14, 51, 0.55) -27.53%, rgba(66, 60, 122, 0.55) 175.86%);
          position: relative;

          color: rgba(173, 163, 239, 1);
          font-size: 14px;
          font-weight: 700;
        }
        
        .arrows {
          position: absolute;
        }
        
        .amount {
          width: 100%;
          min-height: 45px;
          height: auto;
          
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          border-radius: 5px;
          background: rgba(90, 84, 153, 0.27);
          
          color: rgba(173, 163, 239, 0.5);
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          
          cursor: pointer;
        }
        
        .active .amount {
          background: linear-gradient(53deg, rgba(255, 153, 0, 0.25) 54.58%, rgba(249, 172, 57, 0.25) 69.11%);
          border: 1px dashed #FFA755;
          color: var(--gold);
        }
        
        .claimable {
          color: white;
          display: flex;
          align-items: center;
          opacity: 0.5;
        }
        
        .active .amount .claimable {
          opacity: 1;
        }
        
        .claim {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .diamond {
          border: 1px solid rgba(173, 163, 239, 0.55);
          background: rgba(173, 163, 239, 0.25);
          
          height: 8.5px;
          width: 8.5px;
          
          transform: rotate(45deg);
        }
        
        .active .diamond {
          background: linear-gradient(53deg, #F90 54.58%, #F9AC39 69.11%);
          border: unset;
        }
        
        .timer {
          width: 100%;
          height: 6px;
          
          border-radius: 2525px;
          background: rgb(26, 14, 51);
          
          margin: 8px 0;
        }
        
        .active .timer {
          background: linear-gradient(53deg, #F90 54.58%, #F9AC39 69.11%), #5C5586;
        }
        
        .claim-button {
          background: unset;
          border: unset;
          outline: unset;
          
          font-family: "Geogrotesque Wide", sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #7F78BC;
        }
        
        .active .claim-button {
          cursor: pointer;
          color: var(--gold);
        }
      `}</style>
    </>
  )
}

export default RakebackTier