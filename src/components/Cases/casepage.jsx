import {createEffect, createResource, createSignal, For, Show} from "solid-js";
import {A, useParams} from "@solidjs/router";
import CaseTitle from "./casetitle";
import Loader from "../Loader/loader";
import CaseItem from "./caseitem";
import CaseSpinner from "./casespinner";
import {authedAPI} from "../../util/api";
import PlainItem from "../Items/plainitem";
import {useUser} from "../../contexts/usercontextprovider";
import {generateRandomItems} from "../../resources/cases";
import Toggle from "../Toggle/toggle";

function CasePage(props) {

  let params = useParams()

  const [user, {setBalance}] = useUser()
  const [caseObj, {mutate}] = createResource(() => params.slug, fetchCase)
  const [amount, setAmount] = createSignal(1)
  const [spinnerItems, setSpinnerItems] = createSignal([])
  const [spinning, setSpinning] = createSignal('')
  const [offset, setOffset] = createSignal(0)
  const [winningItems, setWinningItems] = createSignal([])
  const [spinTime, setSpinTime] = createSignal(7000)
  const [itemTime, setItemTime] = createSignal(3000)

  createEffect(() => {
    if (caseObj() && caseObj()?.items) {
      let items = []
      for (let i = 0; i < 4; i++) {
        items[i] = generateRandomItems(caseObj()?.items)
      }
      setSpinnerItems(items)
    }
  })

  async function fetchCase(slug) {
    try {
      let c = await authedAPI(`/cases/${slug}`, 'GET', null)
      return mutate(c)
    } catch (e) {
      console.log(e)
      return mutate([])
    }
  }

  function demoSpin() {
    if (spinning() !== '') return

    let items = []
    const sortedItems = caseObj()?.items?.slice().sort((a, b) => a.price - b.price);

    for (let i = 0; i < amount(); i++) {
      let randomTicket = Math.random() * 100;
      for (let item of sortedItems) {
        randomTicket -= item.probability;
        if (randomTicket <= 0) {
          items.push(item)
          break;
        }
      }
    }

    spinCases(items)
  }

  function buyCases(results, newBal) {
    let winningItems = []
    for (let result of results) { // dont need pf data rn ig
      winningItems.push(result.item)
    }
    spinCases(winningItems, newBal)
  }

  function getRandomNumber(min, max) {
    const range = max - min + 1
    return Math.floor(Math.random() * range) + min;
  }

  function spinCases(winningItems, newBal) {
    setOffset(getRandomNumber(-64, 64)) // item width is 130px, center is at 65px, so we have 64px of space

    let items = []
    for (let i = 0; i < amount(); i++) {
      items[i] = generateRandomItems(caseObj()?.items)
      items[i][50] = winningItems[i]
    }

    setWinningItems(winningItems)
    setSpinnerItems(items)
    setSpinning('spinning')
    setTimeout(() => {
      setSpinning('win')

      if (newBal)
        setBalance(newBal)
    }, spinTime() + 500)
    setTimeout(() => setSpinning(''), spinTime() + itemTime())
  }

  function setCasesToOpen(amt) {
    if (spinning() === '' && amt !== amount()) {
      let items = []
      for (let i = 0; i < amt; i++) {
        items[i] = generateRandomItems(caseObj()?.items)
      }
      setSpinnerItems(items)
      setAmount(amt)
    }
  }

  return (
    <>
      <div class='case-container fadein'>
        <div class='controls'>
          <button class='bevel-light back'>
            <svg xmlns="http://www.w3.org/2000/svg" width="5" height="8" viewBox="0 0 5 8" fill="none">
              <path
                d="M0.4976 4.00267C0.4976 3.87722 0.545618 3.75178 0.641454 3.65613L3.65872 0.646285C3.85066 0.454819 4.16185 0.454819 4.35371 0.646285C4.54556 0.837673 4.4976 1.00269 4.4976 1.33952L4.4976 4.00267L4.4976 6.50269C4.4976 7.00269 4.54547 7.16764 4.35361 7.35902C4.16175 7.55057 3.85056 7.55057 3.65863 7.35902L0.641361 4.34921C0.545509 4.25352 0.4976 4.12808 0.4976 4.00267Z"
                fill="#ADA3EF"/>
            </svg>
            BACK TO CASES

            <A href='/cases' class='gamemode-link'></A>
          </button>

          <div class='fast' onClick={() => {
            if (spinning() !== '') return
            setItemTime(itemTime() === 1500 ? 3000 : 1500)
            setSpinTime(spinTime() === 3000 ? 7000 : 3000)
          }}>
            <Toggle active={spinTime() === 3000} toggle={() => null}/>
            <p>FAST OPEN</p>
          </div>
        </div>

        <Show when={!caseObj.loading} fallback={<></>}>
          <div class='mobile-info'>
            <CaseTitle name={caseObj()?.name} full={true}/>

            <div class='cost'>
              <img src='/assets/icons/coin.svg' height='15'/>
              {(caseObj()?.price * amount())?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </div>
        </Show>

        <div class='case-content-container'>
          <div class='case-open-container'>
            <Show when={!caseObj.loading} fallback={<Loader/>}>
              <>
                <div class='case-image'>
                  <div class='image-wrapper'>
                    <img src={`${import.meta.env.VITE_SERVER_URL}${caseObj()?.img}`}/>
                  </div>

                  <A href='/docs/provably' class='provably'>PROVABLY FAIR</A>
                </div>

                <div class='controls-container'>
                                    <span class='title-wrapper'>
                                        <CaseTitle name={caseObj()?.name}/>
                                    </span>

                  <div class='cost hide'>
                    <img src='/assets/icons/coin.svg' height='15'/>
                    {(caseObj()?.price * amount())?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>

                  <div class='case-amount'>
                    <button class={'amount ' + (amount() === 1 ? 'active' : '')}
                            onClick={() => setCasesToOpen(1)}>1
                    </button>
                    <button class={'amount ' + (amount() === 2 ? 'active' : '')}
                            onClick={() => setCasesToOpen(2)}>2
                    </button>
                    <button class={'amount ' + (amount() === 3 ? 'active' : '')}
                            onClick={() => setCasesToOpen(3)}>3
                    </button>
                    <button class={'amount ' + (amount() === 4 ? 'active' : '')}
                            onClick={() => setCasesToOpen(4)}>4
                    </button>
                  </div>

                  <button class='bevel-light demo' onClick={() => demoSpin()}>DEMO OPEN</button>
                  <button class={'bevel-gold open ' + (spinning() !== '' ? 'active' : '')} onClick={async () => {
                    if (spinning() !== '') return

                    setSpinning('loading')
                    let res = await authedAPI(`/cases/${caseObj()?.id}/open`, 'POST', JSON.stringify({
                      amount: amount()
                    }), true)

                    if (!res.results) return setSpinning('')
                    buyCases(res.results, res.balance)
                  }}>
                    {spinning() !== '' ? (
                      <div class='loader-container'>
                        <div class='loader'/>
                        <p>OPENING CASE</p>
                      </div>
                    ) : (
                      <p>OPEN CASE</p>
                    )}
                  </button>
                </div>

                <div class='items'>
                  <For each={caseObj()?.items}>{(item, index) => <CaseItem {...item}/>}</For>
                </div>
              </>
            </Show>
          </div>

          <div class='case-spinner-container'>
            <Show when={!caseObj.loading}>
              {spinning() !== 'win' ? (
                <For each={Array(amount())}>{(spinner, index) => <CaseSpinner spinTime={spinTime()} offset={offset()}
                                                                              items={spinnerItems()[index()]}
                                                                              spinning={spinning()}
                                                                              position={index()}/>}</For>
              ) : (
                <div class='winnings'>
                  <For each={winningItems()}>{(item, index) => <PlainItem {...item}/>}</For>
                </div>
              )}
            </Show>
          </div>
        </div>
      </div>

      <style jsx>{`
        .case-container {
          width: 100%;
          height: fit-content;
        }

        .controls {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
        }

        .fast {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          color: #9A90D1;
          font-size: 13px;
          font-weight: 700;

          border-radius: 3px;
          background: rgba(154, 144, 209, 0.15);

          width: 110px;
          height: 30px;

          cursor: pointer;
        }

        .back {
          font-size: 12px;
          font-weight: 700;
          padding: 7px 10px;

          position: relative;

          display: flex;
          align-items: center;
          gap: 7.5px;
        }

        .case-content-container {
          border-radius: 10px;
          background: rgba(45, 42, 81, 0.80);
          cubic-bezier(0, 1, 0, 1);
        }

        .case-open-container {
          width: 100%;
          height: 250px;

          margin-top: 20px;
          display: flex;
          gap: 30px;

          border-radius: 10px 10px 0px 0px;
          background: rgba(0, 0, 0, 0.21);

          padding: 25px;
        }

        .case-spinner-container {
          min-height: 230px;
          height: fit-content;
          width: 100%;
          padding: 25px;

          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .case-image {
          height: 100%;
          min-width: 182px;
          width: 182px;

          display: flex;
          flex-direction: column;

          border-radius: 10px 10px 3px 3px;
          box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.10) inset;
          overflow: hidden;
        }

        .image-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.15);
        }

        .image-wrapper img {
          width: 150px;
        }

        .controls-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          justify-content: space-between;
        }

        .cost {
          height: 26px;
        }

        .case-amount {
          width: 100%;
          display: flex;
          gap: 8px;
        }

        .amount {
          height: 34px;
          flex: 1;

          border-radius: 3px;
          border: 1px solid #302D57;
          background: rgba(47, 43, 83, 0.48);

          color: #ADA3EF;
          font-family: Geogrotesque Wide;
          font-size: 12px;
          font-weight: 700;

          cursor: pointer;
          transition: all .3s;
        }

        .amount.active {
          border: 1px solid #59E878;
          background: rgba(89, 232, 120, 0.25);
          color: #FFF;
        }

        .demo {
          height: 30px;
          width: 100%;

          color: #ADA3EF;
          font-size: 13px;
          font-weight: 700;
        }

        .open {
          outline: unset;
          border: unset;
          height: 30px;

          color: #FFF;
          font-family: Geogrotesque Wide;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .open.active {
          box-shadow: unset;
          background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
          border: 1px solid #FCA31E;
          color: #FCA31E;
        }

        .loader-container {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
        }

        .loader {
          height: 12px;
          width: 12px;
          border-top: 2px solid #FCA31E;
          border-left: 2px solid #FCA31E;
          border-right: 2px solid #FCA31E;
          border-radius: 50%;
          animation: infinite linear spin 1s;
        }

        .items {
          width: 100%;
          height: 100%;

          display: flex;
          gap: 10px;
          padding: 15px;

          border-radius: 10px;
          background: rgba(0, 0, 0, 0.21);
          overflow-x: scroll;
          scrollbar-color: rgba(173, 163, 239, 0.29) rgba(0, 0, 0, 0.21);
        }

        .items::-webkit-scrollbar {
          height: 3px;
        }

        .items::-webkit-scrollbar-track {
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.21);
        }

        .items::-webkit-scrollbar-thumb {
          border-radius: 10px;
          background: rgba(173, 163, 239, 0.29);
        }

        .winnings {
          flex: 1;
          min-width: 500px;

          min-height: 130px;
          height: 210px;

          border-radius: 10px;
          background: rgba(144, 138, 255, 0.06);
          overflow: hidden;
          position: relative;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }

        .mobile-info {
          display: none;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media only screen and (max-width: 700px) {
          .items {
            display: none;
          }

          .case-open-container {
            justify-content: space-between;
          }
        }

        @media only screen and (max-width: 560px) {
          .case-open-container {
            padding: 0;
            height: 155px;
            gap: 0px;
            margin-top: 12px;
          }

          .case-image {
            width: 130px;
            min-width: 130px;
          }

          .image-wrapper img {
            width: 110px;
          }

          .title-wrapper {
            display: none;
          }

          .cost.hide {
            display: none;
          }

          .cost {
            flex: 1;
          }

          .mobile-info {
            display: flex;
            align-items: center;
            width: 100%;
            justify-content: space-between;
            gap: 12px;
            margin-top: 20px;
          }

          .controls-container {
            width: 100%;
            padding: 15px;
          }

          .case-spinner-container {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}

export default CasePage;