import {createResource, createSignal, For, Show} from "solid-js";
import {addDropdown, api, authedAPI, createNotification} from "../../util/api";
import Loader from "../Loader/loader";
import CryptoTX from "../Transactions/cryptotx";
import {formatNumber} from "../../util/numbers";

function CryptoWithdraw(props) {

  const [robux, setRobux] = createSignal(0)
  const [dollars, setDollars] = createSignal(0)
  const [crypto, setCrypto] = createSignal(0)
  const [rates, setRates] = createSignal({})
  const [address, setAddress] = createSignal('')
  const [price, setPrice] = createSignal(0)

  const [symbol, setSymbol] = createSignal('')
  const [chain, setChain] = createSignal('')
  const [explorers, setExplorers] = createSignal([])
  const [transactions, setTransactions] = createSignal([])

  const [currencyDropdown, setCurrencyDropdown] = createSignal(false)
  const [networkDropdown, setNetworkDropdown] = createSignal(false)
  addDropdown(setCurrencyDropdown)
  addDropdown(setNetworkDropdown)

  const [cryptoTypes] = createResource(fetchCryptoInfo)
  const [txsInfo] = createResource(fetchCryptoTransactions)

  async function fetchCryptoInfo() {
    try {
      let res = await api('/trading/crypto/withdraw', 'GET')
      if (!Array.isArray(res.currencies)) return

      let defaultCurrency = res.currencies.find(e => e.id == 'USDT') || res.currencies[0]
      setRates({
        robux: res?.robuxRate?.robux || 1000,
        usd: res?.robuxRate?.usd || 3.5,
      })
      setPrice(defaultCurrency.price)
      setSymbol(defaultCurrency.id)
      setChain(defaultCurrency.chains.find(e => e.id == 'TRC20') || defaultCurrency.chains[0])
      setExplorers(res.explorers)

      return res?.currencies || []
    } catch (e) {
      console.error(e)

      return
    }
  }

  async function fetchCryptoTransactions() {
    try {
      let res = await authedAPI('/trading/crypto/withdraw/transactions', 'GET')
      if (!Array.isArray(res.data)) return

      setTransactions(res.data || [])
      return res
    } catch (e) {
      console.error(e)

      return
    }
  }

  function convertAmounts(robux, dollars, crypto) {
    if (!rates()) return

    if (robux) {
      dollars = Math.floor(robux / rates().robux * rates().usd * 10000) / 10000 // Round to 4 decimals
      crypto = Math.floor(dollars / price() * 1000000000) / 1000000000 // 9 decimals max
      setRobux(robux)
      setDollars(dollars)
      setCrypto(crypto)
      return
    }

    if (dollars) {
      robux = Math.round(dollars / rates().usd * rates().robux * 100) / 100 // 2 decimals max
      crypto = Math.floor(dollars / price() * 1000000000) / 1000000000 // 9 decimals max
      setDollars(dollars)
      setRobux(robux)
      setCrypto(crypto)
      return
    }

    if (crypto) {
      dollars = Math.floor(crypto * price() * 10000) / 10000 // Round to 4 decimals
      robux = Math.round(dollars / rates().usd * rates().robux * 100) / 100 // 2 decimals max
      setCrypto(crypto)
      setRobux(robux)
      setDollars(dollars)
      return
    }
  }

  function availableChains() {
    return cryptoTypes().find(coin => coin.id === symbol())?.chains || []
  }

  function getCoin(symbol) {
    return cryptoTypes().find(coin => coin.id === symbol)
  }

  function changeCrypto(symbol) {
    let coinInfo = getCoin(symbol)

    setSymbol(symbol)
    setChain(coinInfo.chains[0])
    setPrice(coinInfo.price)
    convertAmounts(robux(), 0, 0)
  }

  function cancelCryptoTX(id) {
    let index = transactions().findIndex(tx => tx.id === id)
    if (index < 0) return

    let updatedStatus = {
      ...transactions()[index]
    }
    updatedStatus.status = 'cancelled'

    setTransactions([
      ...transactions().slice(0, index),
      updatedStatus,
      ...transactions().slice(index + 1)
    ])
  }

  return (
    <>
      <div class='crypto-withdraw-container'>
        <div class='withdraw-header'>
          <p class='type'>You have selected <span class='gold'>{symbol()}</span></p>

          <p>
            <span class='gold'>Withdraw amount: </span>
          </p>
          <img src='/assets/icons/coin.svg' height='18' width='18' alt=''/>
          <p className='white'>{robux()?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</p>
        </div>

        <div class='bar' style={{margin: '15px 0 30px 0'}}/>

        <Show when={!cryptoTypes.loading} fallback={<Loader/>}>
          <>
            <div class='dropdowns'>
              <div class={'dropdown-wrapper ' + (currencyDropdown() ? 'active' : '')} onClick={(e) => {
                setCurrencyDropdown(!currencyDropdown())
                e.stopPropagation()
              }}>
                <p>Currency: </p>
                <img src={`${import.meta.env.VITE_SERVER_URL}/public/cryptos/${symbol()}.png`} height='18'/>
                <p className='white bold'>{symbol()}</p>
                <img class='arrow' src='/assets/icons/dropdownarrow.svg' alt=''/>

                <div class='dropdown-container' onClick={(e) => e.stopPropagation()}>
                  <For each={cryptoTypes()}>{(crypto) =>
                    <p class='option' onClick={() => {
                      changeCrypto(crypto?.id)
                      setCurrencyDropdown(false)
                    }}>
                      <img src={`${import.meta.env.VITE_SERVER_URL}/public/cryptos/${crypto.id}.png`} height='18'/>
                      {crypto?.id}
                    </p>
                  }</For>
                </div>
              </div>

              <div class={'dropdown-wrapper ' + (networkDropdown() ? 'active' : '')} onClick={(e) => {
                setNetworkDropdown(!networkDropdown())
                e.stopPropagation()
              }}>
                <p>Network: </p>
                <p class='white bold'>{chain().id}</p>
                <img className='arrow' src='/assets/icons/dropdownarrow.svg' alt=''/>

                <div class='dropdown-container' onClick={(e) => e.stopPropagation()}>
                  <For each={availableChains()}>{(chain) =>
                    <p class='option' onClick={() => {
                      setChain(chain)
                      setNetworkDropdown(false)
                    }}>{chain?.id}</p>
                  }</For>
                </div>
              </div>
            </div>

            <div class='inputs'>
              <div class='input'>
                <p>YOUR {symbol()} ADDRESS:</p>

                <input class='thin' value={address()} onInput={(e) => setAddress(e.target.value)}/>
              </div>
            </div>

            <div class='conversions-container'>
              <div class='rate'>
                <p>{rates().robux} <span class='gold'>ROBUX</span></p>
                <p>=</p>
                <p>${rates().usd?.toFixed(2)}</p>
                <img class='coin' src='/assets/icons/coin.svg' height='48' width='58' alt=''/>
                <div class='swords'/>
              </div>

              <div class='conversions'>
                <div class='input'>
                  <img src='/assets/icons/coin.svg' width='18' height='17' alt=''/>
                  <input type='number' value={robux()}
                         onInput={(e) => convertAmounts(e.target.valueAsNumber, 0, 0)}/>
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
                  <input type='number' value={dollars()} onInput={(e) => convertAmounts(0, e.target.valueAsNumber, 0)}/>
                </div>

                <svg xmlns="http://www.w3.org/2000/svg" width="5" height="4" viewBox="0 0 5 4"
                     fill="none">
                  <path
                    d="M0.247619 0H4.75238C4.91746 0 5 0.0987654 5 0.296296V1.07407C5 1.27161 4.91746 1.37037 4.75238 1.37037H0.247619C0.0825397 1.37037 0 1.27161 0 1.07407V0.296296C0 0.0987654 0.0825397 0 0.247619 0ZM0.247619 2.62963H4.75238C4.91746 2.62963 5 2.7284 5 2.92593V3.7037C5 3.90123 4.91746 4 4.75238 4H0.247619C0.0825397 4 0 3.90123 0 3.7037V2.92593C0 2.7284 0.0825397 2.62963 0.247619 2.62963Z"
                    fill="#ADA3EF"/>
                </svg>

                <div className='input'>
                  <img src={`${import.meta.env.VITE_SERVER_URL}/public/cryptos/${symbol()}.png`} height='16' width='16' alt=''/>
                  <input type='number' value={crypto()} onInput={(e) => convertAmounts(0, 0, e.target.valueAsNumber)}/>
                </div>
              </div>

              <button class='bevel-gold submit' onClick={async () => {
                let res = await authedAPI('/trading/crypto/withdraw', 'POST', JSON.stringify({
                  currency: symbol(),
                  chain: chain().id,
                  address: address(),
                  amount: robux(),
                }), true)

                if (res.error && res.error === 'KYC') {
                  props?.setKYC(true)
                  return
                }

                if (res.success) {
                  setTransactions([res.transaction, ...transactions()].slice(0,10))
                  createNotification('success', `Successfully created a ${chain().coinName} withdrawal worth ${robux()} Robux.`)
                }
              }}>
                SUBMIT WITHDRAWAL
              </button>
            </div>

            <div className='disclaimer'>
              <p className='disclaimer-text'>
                Enter the Robux amount you’d like to withdraw. Network fees will be deducted from your withdraw amount.
                Average network fees are <span class='white'>${formatNumber(chain()?.fee * price())}</span>
                &nbsp;<span class='bold white noto'>( <img src='/assets/icons/coin.svg' height='12'/> {formatNumber(chain()?.fee * price() / rates().usd * rates().robux)} )</span>.
                Keep in mind that after submitting a withdrawal, the transaction becomes irreversible.
                Double check all input information before proceeding.

                <br/><br/>

                Minimum withdrawal for selected method is <span class='white'>${formatNumber(chain()?.min * price())}</span>
              </p>
            </div>
          </>
        </Show>

        <Show when={!txsInfo.loading}>
          <For each={transactions()}>{(transaction) =>
            <CryptoTX {...transaction} explorers={explorers()} cancel={cancelCryptoTX}/>
          }</For>
        </Show>
      </div>

      <style jsx>{`
        .crypto-withdraw-container {
          width: 100%;
          height: fit-content;

          display: flex;
          flex-direction: column;

          padding: 25px 50px;
        }

        .withdraw-header {
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
        
        .dropdowns {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .dropdown-wrapper {
          flex: 1;
          height: 45px;

          border-radius: 5px 5px 0 0;
          background: rgba(82, 72, 155, 0.41);

          color: #ADA3EF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 14px;
          font-weight: 600;
          
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;

          position: relative;
          padding: 0 12px;
        }
        
        .arrow {
          margin-left: auto;
        }
        
        .active .arrow {
          transform: rotate(180deg);
        }
        
        .dropdown-container {
          position: absolute;
          z-index: 11;
          display: none;
          
          top: 45px;
          left: 0;

          border-radius: 0px 0px 5px 5px;
          overflow: hidden;
        }
        
        .active .dropdown-container {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        
        .option {
          background: #473E83;
          height: 40px;
          line-height: 40px;
          padding: 0 16px;
          
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .option:nth-of-type(2n) {
          background: #3F3776;
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

          border-radius: 5px;
          border: 1px dashed #6258AB;
          background: #383165;

          color: #ADA3EF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 12px;
          font-weight: 700;

          padding: 0 12px;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .input input {
          background: unset;
          outline: unset;
          border: unset;

          width: 100%;
          height: 100%;
          text-align: right;

          color: #FFF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 12px;
          font-weight: 700;
        }

        .conversions .input input {
          text-align: center;
        }

        .info {
          display: flex;
          align-items: center;
          gap: 8px;

          color: #FFF;
          font-size: 12px;
        }

        .thin {
          font-weight: 400 !important;
        }

        .copy {
          border: unset;
          outline: unset;
          padding: unset;
          background: unset;
          cursor: pointer;
        }

        .copy svg {
          fill: #776EB0;
          transition: all .1s;
        }

        .copy:active svg {
          fill: #ADA3EF;
        }

        .conversions-container {
          display: flex;
          align-items: center;

          position: relative;

          margin: 35px 0;
          padding: 10px 0;

          gap: 24px;
        }

        .conversions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .conversions .input {
          max-width: 175px;
        }

        .qr {
          position: absolute;
          top: 0;
          left: 0;

          width: 132px;
          height: 132px;
        }

        .disclaimer {
          display: flex;
          width: 100%;

          border-radius: 12px;
          background: rgba(252, 163, 30, 0.12);
          padding: 12px 24px;
          
          margin-bottom: 20px;
        }

        .disclaimer-text {
          width: 100%;

          color: var(--gold);
          font-size: 14px;
          font-weight: 400;
          text-align: center;
        }

        .rate {
          width: 270px;
          height: 45px;
          margin-left: 20px;

          border-radius: 7px;
          background: linear-gradient(59deg, #6159B0 0%, rgba(82, 72, 159, 0.52) 12.49%, rgba(76, 66, 152, 0.32) 16.42%, rgba(67, 55, 141, 0.00) 100%);

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

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

        .submit {
          width: 170px;
          height: 35px;
        }
      `}</style>
    </>
  );
}

export default CryptoWithdraw;
