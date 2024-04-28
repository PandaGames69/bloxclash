import {useSearchParams} from "@solidjs/router";
import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI} from "../../util/api";
import Loader from "../Loader/loader";
import Pagination from "../Pagination/pagination";

const SITE_TYPES = ['affiliate', 'tip', 'Rakeback', 'rain']
const FIAT_TYPES = ['giftcard']

function Transactions(props) {

    let loadedPages = new Set()
    const [total, setTotal] = createSignal(1)
    const [page, setPage] = createSignal(1)

    const [isLoading, setIsLoading] = createSignal(true)
    const [txs, setTxs] = createSignal([], {equals: false})

    const [searchParams, setSearchParams] = useSearchParams()
    const [transactionsData, {mutate: mutateTransactions}] = createResource(() => searchParams?.filter || '', fetchTransactions)

    async function fetchTransactions() {
        try {
            setPage(+searchParams?.page || 1)
            let txs = await authedAPI(`/user/transactions?page=${page()}${queryParams()}`, 'GET', null)

            setTotal(txs?.pages)
            addPage(txs?.data)
            setIsLoading(false)
            return mutateTransactions(txs)
        } catch (e) {
            console.log(e)
            setIsLoading(false)
            return mutateTransactions(null)
        }
    }

    function isActive(filter) {
        if (filter === '') return !searchParams?.filter || searchParams?.filter === filter

        return searchParams?.filter === filter
    }

    function queryParams() {
        let params = ''

        switch (searchParams?.filter || '') {
            case 'site':
                params += `&methods=${SITE_TYPES.join(',')}`
                break
            case 'roblox':
                params += '&methods=robux'
                break
            case 'crypto':
                params += '&methods=crypto'
                break
            case 'fiat':
                params += `&methods=${FIAT_TYPES.join(',')}`
                break
            default:
                break
        }

        return params
    }

    function addPage(data) {
        return setTxs(txs => {
            txs[page()] = data
            return txs
        })
    }

    async function loadPage() {
        if (isLoading()) return
        setIsLoading(true)
        setSearchParams({page: page()})

        let moreData = await authedAPI(`/user/transactions?page=${page()}${queryParams()}`, 'GET', null)
        if (!moreData) return setIsLoading(false)

        addPage(moreData.data)
        setTotal(moreData.pages)
        loadedPages.add(page())

        setIsLoading(false)
    }

    return (
        <>
            <div class='transactions-container fadein'>
                <div class='tabs'>
                    <button class={'bevel-light tab ' + (isActive('') ? 'active' : '')}
                            onClick={() => setSearchParams({filter: '', page: 1})}>ALL
                    </button>
                    <button class={'bevel-light tab ' + (isActive('roblox') ? 'active' : '')}
                            onClick={() => setSearchParams({filter: 'roblox', page: 1})}>ROBLOX
                    </button>
                    <button class={'bevel-light tab ' + (isActive('crypto') ? 'active' : '')}
                            onClick={() => setSearchParams({filter: 'crypto', page: 1})}>CRYPTO
                    </button>
                    <button class={'bevel-light tab ' + (isActive('fiat') ? 'active' : '')}
                            onClick={() => setSearchParams({filter: 'fiat', page: 1})}>FIAT
                    </button>
                    <button class={'bevel-light tab ' + (isActive('site') ? 'active' : '')}
                            onClick={() => setSearchParams({filter: 'site', page: 1})}>ON-SITE
                    </button>
                </div>

                <div class='bar' style={{margin: '25px 0 20px 0'}}/>

                <Show when={!transactionsData.loading} fallback={<Loader/>}>
                    <>
                        <div class='table'>
                            <div class='table-header'>
                                <div class='table-column'>
                                    <p>TYPE</p>
                                </div>

                                <div class='table-column'>
                                    <p>METHOD</p>
                                </div>

                                <div class='table-column'>
                                    <p>DATE</p>
                                </div>

                                <div class='table-column'>
                                    <p>STATUS</p>
                                </div>

                                <div class='table-column'>
                                    <p>AMOUNT</p>
                                </div>
                            </div>

                            <For each={txs()[page()]}>{(tx, index) => (
                                <div class='table-data'>
                                    <div class='table-column'>
                                        <p class={tx?.type === 'in' || tx?.type === 'deposit' ? 'gold' : ''}>{tx?.type}</p>
                                    </div>

                                    <div class='table-column'>
                                        <p class='white bold'>{tx?.method}</p>
                                    </div>

                                    <div class='table-column'>
                                        <p>{new Date(tx?.createdAt || 0)?.toLocaleString([], {
                                            year: 'numeric',
                                            month: 'numeric',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}</p>
                                    </div>

                                    <div class='table-column'>
                                        <p class='green'>COMPLETED</p>
                                    </div>

                                    <div class='table-column'>
                                        <img src='/assets/icons/coin.svg' height='17' width='17'/>
                                        <p class='white bold'>{tx?.amount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}</For>
                        </div>

                        <Pagination isLoading={isLoading()} loadedPages={loadedPages} loadPage={loadPage} page={page()}
                                    total={total()} setPage={setPage} setParams={setSearchParams}/>
                    </>
                </Show>
            </div>

            <style jsx>{`
              .transactions-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }

              .bar {
                width: 100%;
                height: 1px;
                min-height: 1px;
                background: #5A5499;
              }

              .pagination {
                width: 100%;

                color: #ADA3EF;
                font-family: "Noto Sans", sans-serif;
                font-size: 14px;
                font-weight: 900;

                display: flex;
                align-items: center;
                justify-content: space-between;
              }

              .pagination button {
                outline: unset;
                border: unset;

                width: 78px;
                height: 40px;

                border-radius: 3px;
                background: #423E76;
                box-shadow: 0px 1px 0px 0px #2E2855, 0px -1px 0px 0px #4B4783;
                cursor: pointer;

                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;

                color: #ADA3EF;
                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 15px;
                font-weight: 700;
              }

              .tabs {
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .tab {
                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 13px;
                font-weight: 700;
                padding: 0 15px;
                height: 30px;
                position: relative;

                border: 1px solid transparent;;
                transition: all .2s;
              }

              .tab.active {
                border: 1px solid #4A457D;
                background: #363262;
                color: white;
                box-shadow: unset;
              }

              .table-header, .table {
                margin-bottom: 20px;
              }

              .table-header, .table-data {
                display: flex;
                justify-content: space-between;
              }

              .table-data {
                height: 55px;
                background: rgba(90, 84, 153, 0.35);
                padding: 0 20px;

                display: flex;
                align-items: center;

                color: #ADA3EF;
                font-size: 14px;
                font-weight: 600;
              }

              .table-data:nth-of-type(2n) {
                background: rgba(90, 84, 153, 0.15);
              }

              .table-column {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1 1 0;
                text-transform: uppercase;
              }

              .table-column:nth-of-type(4n), .table-column:nth-of-type(5n) {
                justify-content: flex-end;
              }

              .table-header p {
                background: rgba(90, 84, 153, 0.35);
                height: 25px;
                line-height: 25px;
                padding: 0 15px;
                border-radius: 2px;

                color: #ADA3EF;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
              }

              .green {
                color: #24DD4C;
              }

              @media only screen and (max-width: 1000px) {
                .transactions-container {
                  padding-bottom: 90px;
                }
              }
            `}</style>
        </>
    );
}

export default Transactions;
