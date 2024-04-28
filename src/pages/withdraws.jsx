import {useSearchParams} from "@solidjs/router";
import {createResource, createSignal, For} from "solid-js";
import Method from "../components/Transactions/method";
import RobuxWithdraw from "../components/Withdraws/robuxwithdraw";
import LimitedsWithdraw from "../components/Withdraws/limitedswithdraw";
import WithdrawItem from "../components/Items/withdrawnitem";
import {api, authedAPI, createNotification} from "../util/api";
import LimitedsMFA from "../components/MFA/limitedsmfa";
import {openSupport} from "../util/support";
import CryptoWithdraw from "../components/Withdraws/crypto";
import KYCModal from "../components/KYC/kyc";
import {Title} from "@solidjs/meta";

const METHODS = [
  {name: 'ROBUX', img: '/assets/icons/coin.svg', tab: 'roblox',},
  {name: 'LIMITEDS', img: '/assets/icons/limitedsfull.png', tab: 'roblox', height: '62'},
  {name: 'CRYPTO', img: '/assets/icons/crypto.svg', tab: 'crypto', disabled: true},
]

function Withdraws(props) {

  const [tab, setTab] = createSignal('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedItem, setSelectedItem] = createSignal(null)
  const [refetchMarket, setRefetchMarket] = createSignal(false)
  const [challengeId, setChallengeId] = createSignal(null)
  const [handlingMFA, setHandlingMFA] = createSignal(false)
  const [handlingLimitedBuy, setHandlingLimitedBuy] = createSignal(false)
  const [kyc, setKYC] = createSignal(false)

  function switchTabs(newTab) {
    setSearchParams({type: null, market: null, sort: null})
    setTab(newTab)
    setSelectedItem(null)
  }

  function changeType(name) {
    if (searchParams.type === name.toLowerCase()) {
      return setSearchParams({type: null})
    }
    setSearchParams({type: name.toLowerCase(), market: null, sort: null})
  }

  function isTabActive(name) {
    return !searchParams?.type || searchParams?.type?.toLowerCase() === name.toLowerCase()
  }

  function selectLimited(bundle) {
    if (selectedItem()?.id === bundle.id) {
      setSelectedItem(null)
      return
    }

    setSelectedItem(bundle)
  }

  const withdrawComponents = {
    'robux': () => <RobuxWithdraw/>,
    'limiteds': () => <LimitedsWithdraw refetch={refetchMarket()} selected={selectedItem()} setSelected={setSelectedItem}
                                        selectLimited={selectLimited}/>,
    // 'crypto': () => <CryptoWithdraw setKYC={setKYC}/>,
  }

  return (
    <>
      <Title>BloxClash | Withdraw</Title>

      {(challengeId()) && (
        <LimitedsMFA close={() => setChallengeId(null)} complete={async (code) => {
          if (handlingMFA()) return
          setHandlingMFA(true)

          let res = await authedAPI('/trading/limiteds/buy/2fa', 'POST', JSON.stringify({
            code: code,
            challengeId: challengeId()
          }), true)

          if (res.error && res.error !== 'INVALID_2FA') {
            setChallengeId(null)
            setHandlingMFA(false)
            return
          }

          if (res.success) {
            createNotification('success', `Successfully purchased ${selectedItem()?.items?.length} items for ${selectedItem()?.price} Robux.`)
            setSelectedItem(null)
            setRefetchMarket(!refetchMarket())
            setChallengeId(null)
            setHandlingMFA(false)
          }
        }}/>
      )}

      {kyc() && (
        <KYCModal close={() => setKYC(false)}/>
      )}

      <div class={'withdraws-wrapper ' + (searchParams?.type === 'limiteds' ? 'active' : '')}>
        <div className='withdraws-container'>
          <div className='withdraws-header'>
            <h1>WITHDRAW METHODS</h1>
            <div className='bar'/>
            <p className='white bold'><span className='gold'>NO BONUS</span> ACTIVE</p>
          </div>

          <div className='withdraw-container'>
            <div className='tabs'>
              <button className={'bevel-light tab ' + (tab() === 'all' ? 'active' : '')}
                      onClick={() => switchTabs('all')}>ALL
              </button>

              <button className={'bevel-light tab ' + (tab() === 'roblox' ? 'active' : '')}
                      onClick={() => switchTabs('roblox')}>ROBLOX WITHDRAWS
              </button>

              <button className={'bevel-light tab ' + (tab() === 'crypto' ? 'active' : '')}
                      onClick={() => switchTabs('crypto')}>CRYPTO WITHDRAWS
              </button>

              <div class='support-wrapper'>
                <p>Having issues? Contact support here</p>
                <button class='bevel-light support' onClick={() => openSupport()}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
                    <path
                      d="M9.66916 8.40078C9.15432 9.10787 8.32036 9.5684 7.38075 9.5684H6.06233C5.60689 9.5684 5.21904 9.27925 5.07217 8.87455C4.89089 8.82048 4.71311 8.75028 4.53964 8.66408C4.17226 8.48155 3.83869 8.23426 3.54504 7.92792C1.6403 8.34637 0.214722 10.0436 0.214722 12.074V12.3394C0.214722 12.7043 0.510487 13 0.875316 13H11.1245C11.4894 13 11.7851 12.7043 11.7851 12.3394V12.074C11.7851 10.5055 10.9343 9.13578 9.66916 8.40078Z"
                      fill="#8984C5"/>
                    <path
                      d="M2.8429 6.56629C3.12681 6.56629 3.37393 6.40893 3.50196 6.17672C3.50533 6.18591 3.50875 6.19504 3.5122 6.20418C3.51322 6.20692 3.51424 6.20966 3.51525 6.21241C3.8156 7.00298 4.40001 7.66573 5.17061 7.9553C5.35699 7.65916 5.68655 7.46221 6.06232 7.46221H7.38074C7.51225 7.46221 7.63465 7.42511 7.74195 7.36512C7.92216 7.26436 8.08421 7.00872 8.16789 6.87323C8.30181 6.6564 8.40557 6.42672 8.49757 6.17632C8.54927 6.27021 8.62036 6.35189 8.70555 6.41589V6.73917C8.70555 7.46968 8.11125 8.06401 7.38071 8.06401H6.06229C5.81305 8.06401 5.61098 8.26608 5.61098 8.51532C5.61098 8.7646 5.81305 8.96664 6.06229 8.96664H7.38071C8.60894 8.96664 9.60817 7.9674 9.60817 6.73917V6.41589C9.79087 6.27864 9.90906 6.0602 9.90906 5.81412V4.45326V3.93141C9.90906 3.68027 9.78589 3.45807 9.59678 3.32144C9.45011 1.46542 7.89294 0 5.99988 0C4.10679 0 2.54965 1.46542 2.40298 3.32141C2.21386 3.45804 2.0907 3.68027 2.0907 3.93138V5.81407C2.0907 6.23068 2.42914 6.56629 2.8429 6.56629ZM5.99988 0.902654C7.40127 0.902654 8.55716 1.97361 8.69226 3.34008C8.60357 3.40985 8.53091 3.49902 8.48085 3.60134C8.05499 2.49028 7.10435 1.71673 5.99985 1.71673C4.87154 1.71673 3.93614 2.51686 3.52051 3.5969C3.51995 3.59837 3.51941 3.59987 3.51885 3.60137C3.46879 3.49904 3.39613 3.40987 3.30744 3.3401C3.44263 1.97361 4.59848 0.902654 5.99988 0.902654Z"
                      fill="#8984C5"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className='bar' style={{margin: '0 0 20px 0'}}/>

            <div className='methods'>
              <For each={METHODS?.filter(method => method.tab === tab() || tab() === 'all')}>{(method, index) => (
                <Method {...method} active={isTabActive(method.name)} click={() => changeType(method.name)}/>
              )}</For>
            </div>

            <div className='bar' style={{margin: '20px 0 0 0'}}/>

            {withdrawComponents[searchParams?.type] || (
              <div className='empty'>
                <p>{searchParams?.type ? 'This payment method is currently disabled' : 'Please select a payment method.'}</p>
              </div>
            )}
          </div>
        </div>

        {searchParams?.type === 'limiteds' && (
          <div className='selected-container'>
            {selectedItem() ? (
              <>
                <p class='gold'>SELECTED ITEMS</p>
                <div class='faded-bar'/>
                <div class='selected'>
                  <For each={selectedItem()?.items?.sort((a,b) => b.price - a.price)}>{(item) =>
                    <WithdrawItem price={item.price} items={[item]} click={() => {
                      setSelectedItem(null)
                    }}/>
                  }</For>
                </div>
                <div class='bar' style={{margin: 'auto 0 16px 0'}}/>
                <p class='gold center'>Withdraw amount:</p>
                <div class='depo-amount center'>
                  <img src='/assets/icons/coin.svg' height='15' width='15' alt=''/>
                  <p>{selectedItem()?.price?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</p>
                </div>
                <button class='bevel-gold withdraw' onClick={async () => {

                  if (handlingLimitedBuy()) return;

                  setHandlingLimitedBuy(true);

                  let res = await authedAPI('/trading/limiteds/buy', 'POST', JSON.stringify({
                    listingId: selectedItem().id
                  }), true);

                  setHandlingLimitedBuy(false);

                  if (res.step === '2fa') {
                    setChallengeId(res.challengeId)
                    return
                  }

                  if (res.success) {
                    createNotification('success', `Successfully purchased ${selectedItem()?.items?.length} items for ${selectedItem()?.price} Robux.`)
                    setSelectedItem(null)
                    setRefetchMarket(!refetchMarket())
                  }
                }}>WITHDRAW
                </button>
              </>
            ) : <p class='select'>Please select an item.</p>}
          </div>
        )}
      </div>

      <style jsx>{`
        .withdraws-wrapper {
          width: 100%;
          height: calc(100vh - 130px);
          overflow: hidden;
        }

        .withdraws-wrapper.active {
          padding: 0 235px 0 0;
        }

        .withdraws-container {
          width: 100%;
          max-width: 1175px;
          height: 100%;

          overflow-y: scroll;

          box-sizing: border-box;
          padding: 30px 0;
          margin: 0 auto;
          scrollbar-color: transparent transparent;
        }

        .withdraws-container::-webkit-scrollbar {
          display: none;
        }

        .withdraws-header {
          width: 100%;
          height: 50px;

          border-radius: 10px 10px 0px 0px;
          background: linear-gradient(90deg, rgba(255, 153, 1, 0.35) 0%, rgba(255, 153, 1, 0.23) 29.82%, rgba(255, 153, 1, 0.01) 90%);

          display: flex;
          align-items: center;

          font-size: 12px;
          padding: 0 15px;
          gap: 15px;
        }

        h1 {
          color: #FFF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 22px;
          font-weight: 700;
          margin: unset;

          background: linear-gradient(to right, rgba(255, 153, 0, 1), rgba(249, 172, 57, 1));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }

        .bar {
          flex: 1;
          height: 1px;
          min-height: 1px;
          max-height: 1px;

          border-radius: 2525px;
          background: #3A386D;
        }

        .withdraws-header .bar {
          background: linear-gradient(90deg, #BB8518 0%, rgba(170, 115, 26, 0.00) 100%);
        }

        .withdraw-container {
          width: 100%;
          height: fit-content;
          min-height: 650px;

          border-radius: 0px 0px 10px 10px;
          background: rgba(45, 42, 85, 0.51);
          backdrop-filter: blur(2px);
        }

        .tabs {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 15px;
        }

        .tab {
          padding: 0 12px;
          height: 30px;

          font-family: Geogrotesque Wide, sans-serif;
          font-size: 13px;
          font-weight: 700;
        }

        .tab.active {
          border-radius: 3px;
          background: conic-gradient(from 180deg at 50% 50%, #FFDC18 -0.3deg, #B17818 72.1deg, rgba(156, 99, 15, 0.611382) 139.9deg, rgba(126, 80, 12, 0.492874) 180.52deg, rgba(102, 65, 10, 0.61) 215.31deg, #B17818 288.37deg, #FFDC18 359.62deg, #FFDC18 359.7deg, #B17818 432.1deg);
          box-shadow: unset;
          border: unset;
          position: relative;
          color: var(--gold);
          z-index: 0;
        }

        .tab.active:before {
          border-radius: 3px;
          position: absolute;
          width: calc(100% - 2px);
          height: calc(100% - 2px);
          top: 1px;
          left: 1px;
          content: '';
          background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%), #4A457D;
          z-index: -1;
        }

        .support-wrapper {
          margin-left: auto;

          display: flex;
          align-items: center;
          gap: 10px;

          color: #ADA3EF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 13px;
          font-weight: 600;
        }

        .support {
          width: 26px;
          height: 26px;
        }

        .methods {
          padding: 0 15px;

          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
          grid-gap: 15px;
        }

        .empty {
          width: 100%;
          min-height: 250px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #ADA3EF;
          font-size: 16px;
          font-weight: 700;
        }

        .selected-container {
          min-width: 235px;
          width: 235px;
          height: 100%;

          background: rgba(32, 30, 65, 0.51);

          display: flex;
          flex-direction: column;

          position: absolute;
          right: 0;
          top: 0;

          font-size: 12px;
          font-weight: 700;

          padding: 16px 12px;
        }

        .faded-bar {
          width: 50px;
          height: 1px;
          min-height: 1px;

          border-radius: 15px;
          background: linear-gradient(90deg, #4B4887 0%, rgba(75, 72, 135, 0.00) 100%);

          margin: 15px 0 25px 0;
        }

        .selected {
          display: flex;
          flex-direction: column;

          overflow-y: scroll;

          width: 100%;
          gap: 12px;
          scrollbar-color: transparent transparent;
        }

        .selected::-webkit-scrollbar {
          display: none;
        }

        .select {
          color: #ADA3EF;
          font-size: 13px;
          font-weight: 700;

          text-align: center;
          margin: auto 0;
        }

        .depo-amount {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          color: #FFF;
          font-size: 13px;
          font-weight: 700;

          margin: 6px 0 20px 0;
        }

        .center {
          text-align: center;
        }

        .withdraw {
          min-height: 32px;
        }

        @media only screen and (max-width: 1000px) {
          .withdraws-container {
            padding-bottom: 90px;
          }
        }
      `}</style>
    </>
  );
}

export default Withdraws;
