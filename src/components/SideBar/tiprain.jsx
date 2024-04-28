import {createEffect, createSignal, onCleanup} from "solid-js";
import {addDropdown, authedAPI} from "../../util/api";
import Countup from "../Countup/countup";
import {useRain} from "../../contexts/raincontext";

function TipRain(props) {

    const [active, setActive] = createSignal(false)
    const [amount, setAmount] = createSignal(0)
    const [rain, setRain, time] = useRain()

    function formatTimeLeft() {
        const totalSeconds = Math.floor(time() / 1000)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    addDropdown(setActive)

    return (
        <>
            <div class='tip-rain' onClick={(e) => e.stopPropagation()}>
                <img src='/assets/icons/coin.svg' alt='' width='19'/>
                <p class='rain-amount'>
                    <Countup end={rain()?.amount || 0} gray={true}/>
                </p>

                <button class='bevel-gold' onClick={() => setActive(!active())}>
                    TIP RAIN
                </button>

                <div class={'dropdown ' + (active() ? 'active' : '')}>
                    <div class='decoration-arrow'/>
                    <div class='dropdown-container'>
                        <div class='header'>
                            <p>ENTER TIP AMOUNT</p>

                            <div class='timer'>
                                <img src='/assets/icons/timer.svg' height='12'/>
                                <p>{formatTimeLeft()}</p>
                            </div>
                        </div>

                        <div class='input-wrapper'>
                            <img src='/assets/icons/coin.svg' height='16'/>
                            <input type='number' placeholder='...' value={amount()} onInput={(e) => setAmount(e.target.valueAsNumber)}/>
                        </div>

                        <button class='bevel-gold tip' onClick={async () => {
                            let res = await authedAPI('/rain/tip', 'POST', JSON.stringify({
                                amount: amount()
                            }), true)
                        }}>TIP</button>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .tip-rain {
                width: 100%;
                height: 35px;

                background: conic-gradient(from 180deg at 50% 50%, #FFDC18 -0.3deg, #B17818 72.1deg, rgba(156, 99, 15, 0.611382) 139.9deg, rgba(126, 80, 12, 0.492874) 180.52deg, rgba(102, 65, 10, 0.61) 215.31deg, #B17818 288.37deg, #FFDC18 359.62deg, #FFDC18 359.7deg, #B17818 432.1deg);
                border-radius: 3px;
                
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 0 0 0 10px;

                font-family: 'Geogrotesque Wide';
                font-weight: 700;
                font-size: 14px;
                color: #FFFFFF;

                position: relative;
                z-index: 1;
              }

              .tip-rain:after {
                position: absolute;
                content: '';
                width: calc(100% - 2px);
                height: calc(100% - 2px);

                top: 1px;
                left: 1px;
                z-index: -1;

                background: linear-gradient(0deg, rgba(255, 190, 24, 0.25), rgba(255, 190, 24, 0.25)), linear-gradient(252.77deg, #1A0E33 -27.53%, #423C7A 175.86%);
              }

              .tip-rain button {
                outline: unset;
                border: unset;
                
                height: calc(100% - 2px);

                font-family: 'Geogrotesque Wide';
                font-weight: 700;
                font-size: 12px;
                color: white;
                
                padding: 0 15px;
                
                margin-left: auto;
                cursor: pointer;
              }
              
              .rain-amount {
                margin-top: -2px;
              }
              
              .dropdown {
                position: absolute;
                width: 100%;

                border-radius: 3px 0px 3px 3px;

                top: 40px;
                left: 0;
                
                max-height: 0;
                z-index: 1;
                transition: max-height .3s;
                overflow: hidden;
              }
              
              .dropdown.active {
                max-height: 140px;
              }

              .decoration-arrow {
                width: 13px;
                height: 9px;

                top: 1px;
                background: #20153D;
                position: absolute;
                right: 0;

                border-left: 1px solid #3B2D67;
                border-right: 1px solid #3B2D67;
                border-top: 1px solid #3B2D67;

                clip-path: polygon(0% 100%, 100% 0%, 100% 100%);
              }
              
              .dropdown-container {
                color: #FCA31E;
                padding: 12px 20px;
                margin-top: 9px;
                
                background: linear-gradient(252.77deg, #1A0E33 -27.53%, #423C7A 175.86%);
                border: 1px solid #3B2D67;
                
                display: flex;
                flex-direction: column;
                gap: 10px;
              }
              
              .header {
                display: flex;
                width: 100%;
                align-items: center;
              }
              
              .timer {
                display: flex;
                align-items: center;
                gap: 5px;
                margin-left: auto;
                color: white;
              }
              
              .input-wrapper {
                width: 100%;
                height: 30px;

                background: linear-gradient(0deg, #1C1438, #1C1438), linear-gradient(252.77deg, #1A0E33 -27.53%, #423C7A 175.86%);
                
                padding: 0px 10px;
                
                display: flex;
                align-items: center;
                gap: 10px;

                border-radius: 3px;
              }
              
              .input-wrapper input {
                background: unset;
                border: unset;
                outline: unset;
                
                height: 100%;
                width: 100%;
                
                color: white;
                font-family: 'Geogrotesque Wide';
                font-weight: 700;
                font-size: 13px;
              }
              
              input::placeholder {
                color: white;
              }
              
              .tip {
                outline: unset;
                border: unset;
                min-height: 20px;
                width: 100%;
              }
            `}</style>
        </>
    );
}

export default TipRain;
