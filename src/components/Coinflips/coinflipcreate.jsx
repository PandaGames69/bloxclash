import {createSignal, For} from "solid-js";
import CaseButton from "../Cases/casebutton";
import {getCents} from "../../util/balance";
import {useUser} from "../../contexts/usercontextprovider";
import {authedAPI} from "../../util/api";

function CreateCoinflip(props) {

  let slider
  let robuxInput

  const MIN_BET = 1
  const MAX_BET = 100000

  const [coin, setCoin] = createSignal('fire')
  const [robux, setRobux] = createSignal(MIN_BET, {equals: false})
  const [user] = useUser()

  function createTrail() {
    let max = user() ? Math.min(MAX_BET, user()?.balance) : MIN_BET
    let value = (slider.value - MIN_BET) / (max - MIN_BET) * 100
    slider.style.background = 'linear-gradient(to right, #FCA31E 0%, #FCA31E ' + value + '%, rgba(252, 163, 30, 0.26) ' + value + '%, rgba(252, 163, 30, 0.26) 100%)'
    resizeInput()
  }

  function resizeInput() {
    let length = (robuxInput.value + '').length
    let width = Math.max(12, Math.min(70, length * 10))
    robuxInput.style.width = width + 'px'
  }

  return (
    <>
      <div class='modal fadein' onClick={() => props.close()}>
        <div class='coinflip-create' onClick={(e) => e.stopPropagation()}>
          <div class='header'>
            <button class='exit bevel-light' onClick={() => props.close()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M3.9497 0.447999L5.21006 1.936L6.45216 0.447999C6.68353 0.149333 6.95752 0 7.27413 0H9.6122C9.79486 0 9.90445 0.0533333 9.94099 0.16C9.9897 0.256 9.95925 0.362666 9.84966 0.48L6.79921 3.968L9.88619 7.52C9.99578 7.63733 10.0262 7.74933 9.97752 7.856C9.94099 7.952 9.83139 8 9.64873 8H6.96361C6.68353 8 6.40954 7.85067 6.14163 7.552L4.863 6.048L3.58438 7.552C3.31647 7.85067 3.04857 8 2.78067 8H0.351272C0.180788 8 0.071191 7.952 0.0224814 7.856C-0.0262283 7.74933 0.00421525 7.63733 0.113812 7.52L3.27385 3.936L0.296473 0.48C0.186876 0.362666 0.150344 0.256 0.186876 0.16C0.235586 0.0533333 0.351272 0 0.533933 0H3.10946C3.42607 0 3.70615 0.149333 3.9497 0.447999Z"
                  fill="#ADA3EF"/>
              </svg>
            </button>

            <p class='title'><img src='/assets/icons/coin2.svg' height='20' alt=''/>COINFLIP CREATION</p>

            <button class={'color red ' + (coin() === 'fire' ? 'active' : '')} onClick={() => setCoin('fire')}>
              <img class='coin' src='/assets/icons/firecoin.svg' height='44' width='44'/>
              <div class='coinname'>
                <p>FIRE</p>
              </div>
            </button>

            <button class={'color blue ' + (coin() === 'ice' ? 'active' : '')} onClick={() => setCoin('ice')}>
              <img class='coin' src='/assets/icons/icecoin.svg' height='44' width='44'/>
              <div class='coinname'>
                <p>ICE</p>
              </div>
            </button>

            <div class='min'>
              <p>MINIMUM</p>
              <img src='/assets/icons/coin.svg' height='14' width='14' alt=''/>
              <p class='white price'>
                50
                <span class='gray'>.00</span>
              </p>
            </div>
          </div>

          <div class='items'>
            <div class='robux-container'>
              <div class='coin-container'>
                <img class='spiral' src='/assets/icons/goldspiral.png' height='90' width='90'/>
                <img src='/assets/icons/coin.svg' height='64' width='71'/>
              </div>

              <div class='robux-slider-container'>
                <input ref={slider} type='range' class='range' value={robux()} min={0}
                       max={Math.min(user()?.balance || MIN_BET, MAX_BET)}
                       onInput={(e) => {
                         let num = Math.max(0, Math.min(e.target.valueAsNumber, MAX_BET))
                         setRobux(num)
                         createTrail()
                       }}
                />
              </div>

              <div class='cost selected-robux'>
                <img src='/assets/icons/coin.svg' height='16' alt=''/>
                <input ref={robuxInput} class='robux-input' type='number' value={robux()} onInput={(e) => {
                  resizeInput()
                  let num = Math.max(0, Math.min(e.target.valueAsNumber, MAX_BET))
                  setRobux(num)
                  createTrail()
                }}/>
              </div>
            </div>
            {/*<For each={[]}>{(i, index) => null}</For>*/}
          </div>

          <div class='footer'>
            {/*<div class='selected info'>*/}
            {/*    <p>SELECTED</p>*/}
            {/*</div>*/}

            <div class='info'>
              <p>TOTAL AMOUNT</p>
            </div>

            <div class='cost'>
              <img src='/assets/icons/coin.svg' height='16' alt=''/>
              <p>
                {Math.floor(robux())?.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                <span class='gray'>.{getCents(robux())}</span>
              </p>
            </div>

            <div class='bar'/>

            <button class='bevel-gold done' onClick={async () => {
              let res = await authedAPI('/coinflip/create', 'POST', JSON.stringify({
                side: coin(),
                amount: robux()
              }), true)

              if (res.success) {
                props?.setViewing(res?.coinflip)
                props?.close()
              }
            }}>CREATE
            </button>
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

        .coinflip-create {
          max-width: 1010px;
          width: 100%;
          height: fit-content;
          min-height: 340px;
          max-height: 650px;
          background: #2C2952;

          display: flex;
          flex-direction: column;
          border-radius: 16px;
          overflow: hidden;
        }

        .header, .footer {
          width: 100%;
          min-height: 70px;

          display: flex;
          align-items: center;
          gap: 15px;

          padding: 0 20px;

          background: #322F5F;
        }

        .header {
          background: linear-gradient(109deg, rgba(252, 163, 30, 0.11) 0%, rgba(156, 101, 19, 0.07) 19.78%, rgba(0, 0, 0, 0.00) 100%), #322F5F;
        }

        .footer {
          min-height: 60px;
        }

        .info {
          height: 30px;
          padding: 0 10px;
          margin-left: auto;

          border-radius: 2px;
          background: rgba(90, 84, 153, 0.35);
          line-height: 30px;

          color: #ADA3EF;
          font-size: 11px;
          font-weight: 600;
        }

        .selected {
          margin-right: auto;
        }

        .cost {
          height: 30px;
          padding: 0 12px;
        }

        .selected-robux {
          width: 100%;
          height: 25px;
        }

        .robux-input {
          background: unset;
          border: unset;
          outline: unset;
          width: 30px;

          font-family: "Geogrotesque Wide", sans-serif;
          color: #FFF;
          font-size: 12px;
          font-weight: 700;
        }

        .done {
          height: 30px;
          width: 95px;
        }

        .bar {
          height: 13px;
          width: 1px;
          background: #534F96;
          margin: 0 10px;
        }

        .exit {
          width: 25px;
          height: 25px;
          background: rgba(85, 76, 125, 1);

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .title {
          color: #FFF;
          font-size: 20px;
          font-weight: 700;

          display: flex;
          align-items: center;
          gap: 6px;
        }

        .items {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          grid-gap: 15px;
          flex: 1;
          overflow-y: scroll;
          padding: 20px;
          scrollbar-color: transparent transparent;
        }

        .items::-webkit-scrollbar {
          display: none;
        }

        .min {
          margin-left: auto;
          display: flex;
          gap: 8px;
          align-items: center;
          font-weight: 700;
          font-size: 10px;
          color: #ADA3EF;

          border-radius: 3px;
          background: rgba(90, 84, 153, 0.35);
          padding: 10px 12px;
        }

        .price {
          font-size: 12px;
          margin-top: -2px;
        }

        .color {
          display: flex;
          background: unset;
          outline: unset;
          border: unset;
          align-items: center;
          cursor: pointer;
          padding: unset;
        }

        .coin {
          z-index: 1;
        }

        .coinname {
          border-radius: 28px;

          padding: 0 0 0 25px;
          line-height: 30px;

          font-size: 14px;
          font-weight: 700;

          color: rgba(255, 255, 255, 0.35);
          background: rgba(90, 84, 153, 0.35);
          position: relative;
          z-index: 0;

          width: 85px;
          height: 30px;
          margin-left: -30px;

          transition: all .3s;
        }

        .coinname:before {
          border-radius: 28px;
          position: absolute;
          top: 1px;
          left: 1px;
          content: '';
          height: calc(100% - 2px);
          width: calc(100% - 2px);
          z-index: -1;
        }

        .blue.active .coinname {
          background: linear-gradient(to left, rgba(30, 77, 209, 1), rgba(0, 0, 0, 0));
          color: #1E4DD1;
        }

        .blue.active .coinname:before {
          background: linear-gradient(rgba(30, 77, 209, 0.15), rgba(30, 77, 209, 0.15)), #322F5F;
        }

        .red.active .coinname {
          background: linear-gradient(to left, rgba(236, 75, 69, 1), rgba(0, 0, 0, 0));
          color: #EC4B45;
        }

        .red.active .coinname:before {
          background: linear-gradient(rgba(236, 75, 69, 0.15), rgba(236, 75, 69, 0.15)), #322F5F;
        }

        .coin {
          background: unset;
        }

        .robux-slider-container {
          margin-top: auto;
          border-radius: 3px;
          background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
          width: 100%;
          height: 25px;
          padding: 0 6px;

          display: flex;
          align-items: center;
        }

        .robux-container {
          height: 170px;

          border-radius: 7px;
          border: 1px solid rgba(82, 76, 147, 0.35);
          background: linear-gradient(230deg, rgba(26, 14, 51, 0.26) 0%, rgba(66, 60, 122, 0.26) 100%);

          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;

          padding: 15px;
        }

        .coin-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spiral {
          position: absolute;
        }

        .range {
          -webkit-appearance: none;
          appearance: none;
          outline: unset;

          border-radius: 25px;
          background: rgba(252, 163, 30, 0.26);
          max-width: 190px;
          height: 5px;

          width: 100%;
        }

        .range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 11px;
          height: 11px;
          background: white;
          cursor: pointer;
          border-radius: 50%;
        }

        .range::-moz-range-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 15px;
          height: 15px;
          background: white;
          cursor: pointer;
          border-radius: 50%;
        }
      `}</style>
    </>
  );
}

export default CreateCoinflip;
