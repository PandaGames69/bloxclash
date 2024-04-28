import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";
import Loader from "../Loader/loader";
import Bundle from "../Items/bundle";
import {useSearchParams} from "@solidjs/router";

function LimitedsWithdraw(props) {

    const [params, setParams] = useSearchParams()

    const [peer, {mutate: mutatePeer}] = createResource(() => props?.refetch?.toString(), fetchPeer)
    const [stock, {mutate: mutateStock}] = createResource(() => props?.refetch?.toString(), fetchStock)

    const [numLoaded, setNumLoaded] = createSignal(50)

    async function fetchPeer() {
        try {
            let res = await authedAPI('/trading/limiteds', 'GET', null)
            if (!res || !Array.isArray(res)) return []
            return res
        } catch (e) {
            console.log(e)
            return []
        }
    }

    async function fetchStock() {
        try {
            let res = await authedAPI('/trading/limiteds/adurite', 'GET', null)
            if (!res || !Array.isArray(res)) return []
            return res
        } catch (e) {
            console.error(e)
            return []
        }
    }

    function isActive(bundle) {
        return props?.selected?.id === bundle.id
    }

    function changeMarket(marketType) {
        setParams({ market: marketType })
        props.setSelected(null)
        setNumLoaded(50)
    }

    function endOfScroll(e) {
        let height = e.target.scrollHeight - e.target.clientHeight

        if (e.target.scrollTop >= height) {
            let max = (params.market === 'p2p' ? peer().length : stock().length) || 0
            setNumLoaded(Math.min(numLoaded() + 50, max))
        }
    }

    return (
        <>
            <div class='limiteds-deposit-container'>
                <div class='deposit-header'>
                    <p>You have selected <span class='gold'>LIMITEDS</span></p>
                    <div class='types'>
                        <button class={`type bevel-light ${(!params.market || params.market === 'stock') ? 'active' : ''}`}
                                onClick={() => changeMarket('stock')}>
                            STOCK
                        </button>
                        <button class={`type bevel-light ${params.market === 'p2p' ? 'active' : ''}`}
                                onClick={() => changeMarket('p2p')}>
                            P2P
                        </button>
                    </div>
                    <div class='sorting'>

                    </div>
                </div>

                <div class='bar' style={{margin: '15px 0'}}/>

                <div class='items' onScroll={e => endOfScroll(e)}>
                    {!params.market || params.market === 'stock' ? (
                        <Show when={!stock.loading} fallback={<Loader/>}>
                            <For each={stock()?.sort((a,b) => b.price - a.price)?.slice(0, numLoaded())}>{(bundle, index) =>
                                <Bundle price={bundle?.price} items={bundle?.items} active={isActive(bundle)} click={() => props?.selectLimited(bundle)}/>
                            }</For>
                        </Show>
                    ) : params.market === 'p2p' ? (
                        <Show when={!peer.loading} fallback={<Loader/>}>
                            <For each={peer()?.sort((a,b) => b.price - a.price)}>{(bundle, index) =>
                                <Bundle price={bundle?.price} items={bundle?.items} active={isActive(bundle)} click={() => props?.selectLimited(bundle)}/>
                            }</For>
                        </Show>
                    ) : null}
                </div>
            </div>

            <style jsx>{`
              .limiteds-deposit-container {
                width: 100%;
                height: fit-content;

                display: flex;
                flex-direction: column;
                align-items: center;

                padding: 25px 50px;
              }

              .deposit-header {
                width: 100%;

                color: #ADA3EF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 13px;
                font-weight: 600;

                display: flex;
                align-items: center;
                gap: 12px;
              }

              .bar {
                width: 100%;
                height: 1px;
                min-height: 1px;
                background: #4B4887;
              }
              
              .types {
                margin-right: auto;
                
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .type {
                color: #ADA3EF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 11px;
                font-weight: 700;
                
                padding: 0 10px;
                height: 26px;
              }
              
              .type.active {
                border-radius: 3px;
                border: 1px solid rgba(173, 163, 239, 0.25);
                background: rgba(74, 69, 125, 0.35);
                box-shadow: unset;
                color: white;
              }

              .items {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(142px, 1fr));
                grid-gap: 10px;
                
                width: 100%;
                max-height: 500px;
                overflow-y: scroll;
              }
              
              .items::-webkit-scrollbar {
                display: none;
              }
            `}</style>
        </>
    );
}

export default LimitedsWithdraw;
