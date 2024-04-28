import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";
import Loader from "../Loader/loader";
import AdminMFA from "../MFA/adminmfa";
import {useSearchParams} from "@solidjs/router";
import NumberPrefix from "../Transactions/prefix";
import Pagination from "../Pagination/pagination";

function AdminStatsbook(props) {

    let loadedPages = new Set()
    const [total, setTotal] = createSignal(1)
    const [page, setPage] = createSignal(1)
    const [isLoading, setIsLoading] = createSignal(true)

    const [params, setParams] = useSearchParams()
    const [stats, setStats] = createSignal([], { equals: false })
    const [statsbook, {
        mutate: mutateStats,
        refetch: refetchStats
    }] = createResource(fetchStats)

    async function fetchStats() {
        try {
            let statsbookRes = await authedAPI(`/admin/statsbook?page=${params.page || 1}`, 'GET', null)
            if (statsbookRes.error && statsbookRes.error === '2FA_REQUIRED') {
                return mutateStats({mfa: true})
            }

            setPage(+params?.page || 1)
            setTotal(statsbookRes?.pages)
            addStatsPage(statsbookRes.data)
            setIsLoading(false)
            return mutateStats(statsbookRes)
        } catch (e) {
            console.log(e)
            return mutateStats(null)
        }
    }

    function addStatsPage(data) {
        return setStats(stats => {
            stats[page()] = data
            return stats
        })
    }

    async function loadPage() {
        if (isLoading()) return
        setIsLoading(true)
        setParams({ page: page() })

        let moreData = await authedAPI(`/admin/statsbook?page=${page()}`, 'GET', null)
        if (!moreData) return setIsLoading(false)

        addStatsPage(moreData.data)
        setTotal(moreData.pages)
        loadedPages.add(page())

        setIsLoading(false)
    }

    function getColor(amount) {
        if (amount === 0) return ''
        if (amount > 0) return 'green'
        return 'red'
    }

    return (
        <>
            {statsbook()?.mfa && (
                <AdminMFA refetch={() => {
                    refetchStats()
                }}/>
            )}

            <div class='statsbook-wrapper'>
                <div className='table-header'>
                    <div className='table-column'>
                        <p>DATE</p>
                    </div>

                    <div className='table-column'>
                        <p>NPC</p>
                    </div>

                    <div className='table-column'>
                        <p>LIMITEDS</p>
                    </div>

                    <div className='table-column'>
                        <p>ROBUX</p>
                    </div>

                    <div className='table-column'>
                        <p>GIFTCARDS</p>
                    </div>

                    <div className='table-column'>
                        <p>CRYPTO</p>
                    </div>

                    <div className='table-column'>
                        <p>CC</p>
                    </div>

                    <div className='table-column'>
                        <p>SURVEYS</p>
                    </div>

                    <div className='table-column'>
                        <p>NET</p>
                    </div>
                </div>

                <Show when={!statsbook.loading} fallback={<Loader/>}>
                    <div class='table'>
                        <For each={stats()[page()] || []}>{(stat, index) =>
                            <div className='table-data'>
                                <div className='table-column'>
                                    <p>{stat?.date}</p>
                                </div>

                                <div className='table-column'>
                                    <p>{stat?.npc}</p>
                                </div>

                                <div className='table-column'>
                                    <NumberPrefix amount={stat?.limitedsDeposits}/>
                                    <img src='/assets/icons/coin.svg' height='15' width='16' alt=''/>
                                    <p className='white'>{(stat?.limitedsDeposits || 0)?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</p>
                                </div>

                                <div className='table-column'>
                                    <NumberPrefix amount={stat?.robuxDeposits}/>
                                    <img src='/assets/icons/coin.svg' height='15' width='16' alt=''/>
                                    <p className='white'>{(stat?.robuxDeposits || 0)?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</p>
                                </div>

                                <div className='table-column'>
                                    <p className={getColor(stat?.giftCardDeposits)}>${(stat?.giftCardDeposits || 0)?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</p>
                                </div>

                                <div className='table-column'>
                                    <p className="green">${(stat?.cryptoDeposits || 0)?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</p> / <p className="red">${(stat?.cryptoWithdraws || 0)?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</p>
                                </div>

                                <div className='table-column'>
                                    <p className={getColor(stat?.creditCardDeposits)}>${(stat?.creditCardDeposits || 0)?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</p>
                                </div>

                                <div className='table-column'>
                                    <p className={getColor(stat?.surveysRevenue)}>${(stat?.surveysRevenue || 0)?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</p>
                                </div>

                                <div className='table-column'>
                                    <p className={getColor(stat?.netProfit)}>${(stat?.netProfit || 0)?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</p>
                                </div>
                            </div>
                        }</For>
                    </div>

                    <Pagination isLoading={isLoading()} loadedPages={loadedPages} loadPage={loadPage} page={page()} total={total()} setPage={setPage} setParams={setParams}/>
                </Show>
            </div>

            <style jsx>{`
              .statsbook-wrapper {
                display: flex;
                flex-direction: column;
              }
              
              .table {
                display: flex;
                flex-direction: column;
                margin-bottom: 20px;
              }

              .table-header, .table-data {
                display: flex;
                justify-content: space-between;
              }

              .red {
                color: #ff5959;
              }

              .table-data {
                height: 55px;
                background: rgba(90, 84, 153, 0.35);
                padding: 0 20px;

                display: flex;
                align-items: center;

                color: #ADA3EF;
                font-size: 14px;
                font-weight: 700;
              }

              .table-data:nth-of-type(2n) {
                background: rgba(90, 84, 153, 0.15);
              }

              .table-column {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1 1 0;
              }

              .table-column:nth-of-type(9n) {
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
              }
            `}</style>
        </>
    );
}

export default AdminStatsbook;
