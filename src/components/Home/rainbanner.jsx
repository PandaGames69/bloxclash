import {For} from "solid-js";
import {useRain} from "../../contexts/raincontext";

function RainBanner(props) {

  const [rain, userRain, time] = useRain()

  function formatTimeLeft() {
    const totalSeconds = Math.floor(time() / 1000)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <>
      <div class='rain-banner'>
        <div class='rain-header'>
          <h1>RAIN</h1>

          <p className='timer'>
            <img src='/assets/icons/timer.svg' height='16' alt=''/>
            {formatTimeLeft()}
          </p>
        </div>

        <div class='amount-wrapper'>
          <div class='coin'>
            <img src='/assets/icons/coin.svg' height='22' alt=''/>
          </div>

          <div className='amount gold'>
            <For each={[...('0' + (rain()?.amount?.toFixed(2) || 0) + '')]}>{(digit, index) =>
              <>
                <p className='digit'>{digit}</p>
                <div className='line'/>
              </>
            }</For>
          </div>
        </div>

        <h2>TIP, WAGER & PLAY TO INCREASE THE RAIN ON SITE!</h2>

        <img src='/assets/icons/coinreverse.png' class='coinart first' height='48' width='48' alt=''/>
        <img src='/assets/icons/coin.svg' class='coinart second' height='70' height='60' alt=''/>
        <div class='swords'/>
      </div>

      <style jsx>{`
        .rain-banner {
          flex: 1;
          min-height: 165px;
          max-width: 100%;

          border-radius: 8px;
          background: linear-gradient(to left, rgba(200, 87, 226, 0.7), rgba(140, 87, 226, 0.7));

          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 16px 32px;

          position: relative;
        }

        .rain-banner > * {
          z-index: 1;
          position: relative;
        }

        .rain-banner:before {
          position: absolute;
          content: '';

          width: calc(100% - 2px);
          height: calc(100% - 2px);

          border-radius: 8px;
          top: 1px;
          left: 1px;
          z-index: 0;

          background: linear-gradient(to right, rgba(149, 84, 255, 0.2) 0%, rgba(0, 0, 0, 0.00) 40%), linear-gradient(to left, rgba(255, 74, 161, 0.2) 0%, rgba(0, 0, 0, 0.00) 40%), rgba(35, 18, 85, 0.8);
        }

        .rain-banner h1 {
          font-size: 44px;
          font-family: "Geogrotesque Wide", sans-serif;
          font-weight: 700;
          background: linear-gradient(53deg, #F90 54.58%, #F9AC39 69.11%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0px 3px 6px rgba(0, 0, 0, 0.15), 0px 0px 55px rgba(249, 172, 57, 0.35);
          margin: unset;
        }

        .rain-banner h2 {
          color: #FFF;
          font-size: 15px;
          font-family: "Geogrotesque Wide", sans-serif;
          font-weight: 700;

          z-index: 1;
        }

        .coins {
          position: absolute;
          z-index: 0 !important;
          left: 50%;
          transform: translateX(-50%);
        }

        .info {
          margin-left: auto;
          z-index: 1 !important;
        }
        
        .amount-wrapper {
          display: flex;
          gap: 12px;
        }
        
        .coin {
          border-radius: 6px;
          border: 1px solid #B17818;
          background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);
          
          width: 40px;
          height: 40px;
          
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .amount {
          border-radius: 3px;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%), linear-gradient(180deg, rgba(191, 128, 255, 0.15) 0%, rgba(191, 128, 255, 0.00) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);
          box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.32) inset, 0px -2px 4px 0px rgba(0, 0, 0, 0.05) inset;

          height: 40px;
          width: fit-content;

          font-family: "Geogrotesque Wide", sans-serif;
          font-weight: 700;
          display: flex;
        }

        .digit {
          display: block;
          padding: 0 15px;
          line-height: 40px;
          font-size: 16px;
        }
        
        .amount .digit:nth-last-child(-n+6) {
          opacity: 0.5;
        }

        .line:not(:last-child) {
          width: 1px;
          height: 100%;
          background: linear-gradient(180deg, rgba(77, 58, 121, 0.00) 0%, #6D53AF 50.99%, rgba(77, 58, 121, 0.00) 100%);
        }
        
        .rain-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          
          color: #FFF;
          font-size: 16px;
          font-weight: 600;
          
          padding: 6px 10px;

          border-radius: 4px;
          border: 1px solid #7718B1;
          background: linear-gradient(268deg, rgba(79, 37, 136, 0.55) 0.82%, rgba(97, 55, 120, 0.55) 108.47%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);
        }

        .swords {
          width: calc(100% - 2px);
          height: calc(100% - 2px);

          top: 1px;
          left: 1px;
          position: absolute !important;
          z-index: 0 !important;

          opacity: 0.1;
          background-image: url("/assets/art/rainswords.png");
          background-position: center;
          background-size: cover;
          border-radius: 8px;
        }
        
        .coinart {
          position: absolute !important;
        }
        
        .coinart.first {
          top: 10px;
          right: -10px;
        }
        
        .coinart.second {
          bottom: 10px;
          right: 5px;
        }

        @media only screen and (max-width: 1000px) {
          .coins {
            display: none;
          }
        }

        @media only screen and (max-width: 600px) {
          .digit {
            padding: 0 8px;
          }
        }
      `}</style>
    </>
  );
}

export default RainBanner;
