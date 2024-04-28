import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";
import {toast} from "solid-toast";
import Loader from "../Loader/loader";
import RobuxTX from "../Transactions/robuxtx";

function RobuxDeposit(props) {

    const [robux, setRobux] = createSignal(0)
    const [txs, setTxs] = createSignal([], { equals: false })
    const [txsResource, {mutate}] = createResource(fetchTXs)

    async function fetchTXs() {
        try {
            let res = await authedAPI('/trading/robux/transactions', 'GET', null)
            if (!res.data) return mutate(null)

            setTxs(res.data)
            return mutate(res)
        } catch (e) {
            console.log(e)
            return mutate([])
        }
    }

    function cancelRobuxTx(id) {
        let index = txs().findIndex(tx => tx.id === id)
        if (index < 0) return

        let updatedStatus = {
            ...txs()[index]
        }
        updatedStatus.status = 'cancelled'
        updatedStatus.filledAmount = null
        updatedStatus.queuePosition = null

        setTxs([
            ...txs().slice(0, index),
            updatedStatus,
            ...txs().slice(index + 1)
        ])
    }

    return (
        <>
            <div class='robux-deposit-container'>
                <div class='deposit-header'>
                    <p class='type'>You have selected <span class='gold'>ROBUX</span></p>

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

                <div className='inputs'>
                    <div className='input'>
                        <img src='/assets/icons/coin.svg' width='18' height='17' alt=''/>
                        <input type='number' value={robux()}
                               onInput={(e) => setRobux(e.target.valueAsNumber)}/>
                    </div>
                </div>

                <button class='bevel-gold deposit' onClick={async () => {
                    let res = await authedAPI('/trading/robux/deposit', 'POST', JSON.stringify({
                        amount: robux(),
                    }), true)

                    if (res.id) {
                        createNotification('success', `You are now in position ${res.queuePosition} to deposit your ${robux()} Robux.`)
                        setTxs([res, ...txs()])
                    }
                }}>DEPOSIT
                </button>

                <div class='bar' style={{margin: '0 0 30px 0'}}/>

                <Show when={!txsResource.loading} fallback={<Loader/>}>
                    <For each={txs()?.filter(tx => tx.operation === 'deposit')}>{(tx, index) =>
                        <RobuxTX {...tx} cancel={cancelRobuxTx}/>
                    }</For>
                </Show>
            </div>

            <style jsx>{`
              .robux-deposit-container {
                width: 100%;
                height: fit-content;

                display: flex;
                flex-direction: column;
                align-items: center;

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
                width: 100%;
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

              .input input {
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
                margin: 30px 0;
              }
            `}</style>
        </>
    );
}

export default RobuxDeposit;
