import {createResource, createSignal, Show} from "solid-js";
import {authedAPI} from "../../util/api";
import Loader from "../Loader/loader";

function CreditCardDeposit(props) {

  const [robux, setRobux] = createSignal(0)
  const [dollars, setDollars] = createSignal(0)
  const [rates, setRates] = createSignal({})
  const [processing, setProcessing] = createSignal(false)
  const [info, {mutate}] = createResource(fetchCCInfo)

  async function fetchCCInfo() {
    try {
      let res = await authedAPI('/trading/deposit/cc', 'GET')

      setRates({
        robux: res?.rate?.robux || 1000,
        usd: res?.rate?.usd || 3.5,
      })

      convertAmounts(0, res?.minAmount)

      return res
    } catch (e) {
      console.log(e)
      return mutate(null)
    }
  }

  function convertAmounts(robux, dollars, preFees) {
    if (!rates()) return

    if (robux) {
      dollars = Math.ceil((robux / rates().robux * rates().usd * 1.035 + 0.35) * 100) / 100

      setRobux(robux)
      setDollars(dollars)
      return
    }

    if (dollars) {
      robux = Math.ceil(((dollars / 1.035 - 0.35) / rates().usd * rates().robux) * 100) / 100;

      setDollars(dollars)
      setRobux(robux)
      return
    }
  }

  return (
    <>
      <div class='crypto-deposit-container'>
        <div class='deposit-header'>
          <p class='type'>You have selected <span class='gold'>CREDIT CARD</span></p>

          <p>
            <span class='gold'>Deposit amount: </span>
          </p>
          <img src='/assets/icons/coin.svg' height='18' width='18' alt=''/>
          <p className='white'>{robux()?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</p>
        </div>

        <div class='bar' style={{margin: '15px 0 30px 0'}}/>

        <Show when={!info.loading} fallback={<Loader/>}>
          <>
            <div className='inputs'>
              <div className='robux-input'>
                <img src='/assets/icons/coin.svg' width='18' height='17' alt=''/>
                <input type='number' value={robux()}
                       onInput={(e) => convertAmounts(e.target.valueAsNumber, 0) }/>
              </div>
            </div>

            <div className='conversions-container'>
              <div className='rate'>
                <p>{rates().robux} <span className='gold'>ROBUX</span></p>
                <p>=</p>
                <p>${rates().usd}</p>
                <img className='coin' src='/assets/icons/coin.svg' height='48' width='58' alt=''/>
                <div className='swords'/>
              </div>

              <div className='conversions'>
                <div className='input'>
                  <img src='/assets/icons/coin.svg' width='18' height='17' alt=''/>
                  <input type='number' value={robux()}
                         onInput={(e) => convertAmounts(e.target.valueAsNumber, 0)}/>
                </div>

                <svg xmlns="http://www.w3.org/2000/svg" width="5" height="4" viewBox="0 0 5 4"
                     fill="none">
                  <path
                    d="M0.247619 0H4.75238C4.91746 0 5 0.0987654 5 0.296296V1.07407C5 1.27161 4.91746 1.37037 4.75238 1.37037H0.247619C0.0825397 1.37037 0 1.27161 0 1.07407V0.296296C0 0.0987654 0.0825397 0 0.247619 0ZM0.247619 2.62963H4.75238C4.91746 2.62963 5 2.7284 5 2.92593V3.7037C5 3.90123 4.91746 4 4.75238 4H0.247619C0.0825397 4 0 3.90123 0 3.7037V2.92593C0 2.7284 0.0825397 2.62963 0.247619 2.62963Z"
                    fill="#ADA3EF"/>
                </svg>

                <div className='input'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="11" viewBox="0 0 8 11"
                       fill="none">
                    <path
                      d="M5.21667 3.86618V3.65588C5.21667 3.3 4.82778 3.12206 4.05 3.12206C3.28333 3.12206 2.9 3.3 2.9 3.65588V3.80147C2.9 4.01716 3.03333 4.15735 3.3 4.22206L5.95 4.85294C7.31667 5.17647 8 5.78039 8 6.66471V7.425C8 7.92108 7.79444 8.36863 7.38333 8.76765C6.98333 9.15588 6.36111 9.42549 5.51667 9.57647V10.5147C5.51667 10.8382 5.36111 11 5.05 11H3.16667C2.84444 11 2.68333 10.8382 2.68333 10.5147V9.625C1.77222 9.4848 1.09444 9.2152 0.65 8.81618C0.216667 8.41716 0 7.95882 0 7.44118V7.11765C0 6.83726 0.15 6.69706 0.45 6.69706H2.21667C2.51667 6.69706 2.66667 6.83726 2.66667 7.11765V7.31176C2.66667 7.67843 3.10556 7.86176 3.98333 7.86176C4.88333 7.86176 5.33333 7.68922 5.33333 7.34412V7.18235C5.33333 6.96667 5.11111 6.8049 4.66667 6.69706L2.1 6.03382C1.6 5.90441 1.16667 5.67255 0.8 5.33824C0.444444 4.99314 0.266667 4.6049 0.266667 4.17353V3.65588C0.266667 3.13824 0.455556 2.67451 0.833333 2.26471C1.22222 1.84412 1.83889 1.55833 2.68333 1.40735V0.485294C2.68333 0.161765 2.84444 0 3.16667 0H5.05C5.36111 0 5.51667 0.161765 5.51667 0.485294V1.42353C6.35 1.57451 6.95 1.8549 7.31667 2.26471C7.69444 2.66373 7.88333 3.12745 7.88333 3.65588V3.86618C7.88333 4.02794 7.84444 4.14118 7.76667 4.20588C7.7 4.27059 7.58333 4.30294 7.41667 4.30294H5.65C5.36111 4.30294 5.21667 4.15735 5.21667 3.86618Z"
                      fill="#59E878"/>
                  </svg>
                  <input type='number' value={dollars()}
                         onInput={(e) => convertAmounts(0, e.target.valueAsNumber, 0)}/>
                </div>
              </div>

              <button class='bevel-gold deposit' onClick={async () => {
                if (processing()) return
                setProcessing(true)

                let res = await authedAPI('/trading/deposit/cc', 'POST', JSON.stringify({
                  amount: robux()
                }), true)

                if (res.url) {
                  window.open(res.url, '_blank')
                }

                setProcessing(false)
              }}>
                PROCEED
              </button>
            </div>

            <div className='disclaimer'>
              <p className='disclaimer-text'>
                Minimum deposit amount is ${info()?.minAmount}, all credit card deposits have a $0.35 base fee and a 3.5% included by our payment processor.
              </p>
            </div>
          </>
        </Show>
      </div>

      <style jsx>{`
        .crypto-deposit-container {
          width: 100%;
          height: fit-content;

          display: flex;
          flex-direction: column;
          gap: 20px;

          padding: 25px 50px;
        }

        .deposit-header {
          display: flex;
          width: 100%;

          color: #ADA3EF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 13px;
          font-weight: 600;

          gap: 8px;
        }

        .bar {
          flex: 1;
          height: 1px;
          min-height: 1px;
          background: #4B4887;
        }

        .type {
          margin-right: auto;
        }

        .inputs {
          display: flex;
          flex-wrap: wrap;
          width: 100%;
          gap: 10px;
        }

        .input {
          border: unset;
          outline: unset;
          white-space: nowrap;

          flex: 1 1 0;
          height: 45px;

          border-radius: 3px;
          border: 1px solid #423B78;
          background: #2F2A54;

          color: #ADA3EF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 12px;
          font-weight: 700;

          padding: 0 12px;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .robux-input {
          border: unset;
          outline: unset;
          white-space: nowrap;

          flex: 1 1 0;
          height: 45px;

          border-radius: 3px;
          border: 1px dashed rgba(177, 120, 24);
          background: #2F2A54;

          color: #ADA3EF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 12px;
          font-weight: 700;

          padding: 0 12px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .robux-input input {
          background: unset;
          outline: unset;
          border: unset;

          width: 100%;
          height: 100%;

          color: #FFF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 12px;
          font-weight: 700;
        }

        .deposit {
          height: 35px;
          padding: 0 45px;
        }

        .input input {
          background: unset;
          outline: unset;
          border: unset;

          width: 100%;
          height: 100%;
          text-align: center;

          color: #FFF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 12px;
          font-weight: 700;
        }

        .conversions-container {
          display: flex;
          align-items: center;
          justify-content: space-between;

          position: relative;

          padding: 10px 0;
          gap: 6px;
        }

        .conversions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .conversions .input {
          max-width: 175px;
        }

        .rate {
          width: 270px;
          height: 40px;
          margin-left: 20px;

          border-radius: 7px;
          background: linear-gradient(59deg, #6159B0 0%, rgba(82, 72, 159, 0.52) 12.49%, rgba(76, 66, 152, 0.32) 16.42%, rgba(67, 55, 141, 0.00) 100%);

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;

          color: #FFF;
          font-size: 16px;
          font-weight: 700;
          
          position: relative;
        }

        .swords {
          width: 100%;
          height: 100%;

          position: absolute !important;
          z-index: 0;

          opacity: 0.1;
          background-image: url("/assets/art/rainswords.png");
          background-position: center;
          background-size: cover;
          border-radius: 8px;
        }

        .rate .coin {
          position: absolute;
          left: -20px;
          z-index: 10;
        }

        .disclaimer {
          display: flex;
          width: 100%;
        }

        .disclaimer-text {
          max-width: 50%;

          color: #ADA3EF;
          font-size: 12px;
          font-weight: 700;
        }
      `}</style>
    </>
  );
}

export default CreditCardDeposit;
