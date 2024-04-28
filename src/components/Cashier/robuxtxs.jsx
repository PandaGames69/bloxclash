import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";
import Loader from "../Loader/loader";
import AdminMFA from "../MFA/adminmfa";
import Avatar from "../Level/avatar";
import {useSearchParams} from "@solidjs/router";
import Pagination from "../Pagination/pagination";
import {addPage} from "../../util/pagination";

function AdminRobuxCashier(props) {

    let loadedPages = new Set()
    const [total, setTotal] = createSignal(1)
    const [page, setPage] = createSignal(1)
    const [isLoading, setIsLoading] = createSignal(true)

    const [username, setUsername] = createSignal('')
    const [transactions, setTransactions] = createSignal([], {equals: false})

    const [params, setParams] = useSearchParams()
    const [txsResource, {
        mutate: mutateTransactions,
        refetch: refetchTransactions
    }] = createResource(() => params?.search || '', fetchRobuxTransactions)

    async function fetchRobuxTransactions(search) {
        try {
            setUsername(search)
            setPage(+params?.page || 1)
            let txRes = await authedAPI(`/admin/cashier/transactions?page=${page()}${params?.search ? `&search=${params?.search}` : ''}`, 'GET', null)
            if (txRes.error && txRes.error === '2FA_REQUIRED') {
                return mutateTransactions({mfa: true})
            }

            setTotal(txRes.pages)
            setIsLoading(false)
            addPage(txRes?.data, page(), setTransactions)
            return mutateTransactions(txRes)
        } catch (e) {
            console.log(e)
            return mutateTransactions(null)
        }
    }

    async function loadPage() {
        if (isLoading()) return
        setIsLoading(true)
        setParams({page: page()})

        let moreData = await authedAPI(`/admin/cashier/transactions?page=${page()}${params?.search ? `&search=${params?.search}` : ''}`, 'GET', null)
        if (!moreData) return setIsLoading(false)

        addPage(moreData.data, page(), setTransactions)
        setTotal(moreData.pages)
        loadedPages.add(page())

        setIsLoading(false)
    }

    async function denyTX(tx) {
        let res = await authedAPI(`/admin/cashier/remove/${tx.id}`, 'POST', null, true)

        if (res?.success) {
            createNotification('success', `Successfully cancelled the transaction.`)
            let newTxs = transactions()
            let index = newTxs[params.page || 1].findIndex(t => t.id === tx.id)

            newTxs[params.page || 1] = [
                ...newTxs[params.page || 1].slice(0, index),
                ...newTxs[params.page || 1].slice(index + 1)
            ]

            setTransactions(newTxs)
        }
    }

    return (
        <>
            {txsResource()?.mfa && (
                <AdminMFA refetch={() => {
                    refetchTransactions()
                }}/>
            )}

            <div className='users-wrapper'>
                <div className='table-header'>
                    <div className='table-column'>
                        <p>USERNAME</p>
                    </div>

                    <div className='table-column'>
                        <p>METHOD</p>
                    </div>

                    <div className='table-column'>
                        <p>AMOUNT</p>
                    </div>

                    <div className='table-column'>
                        <p>OPTION</p>
                    </div>
                </div>

                <Show when={!txsResource.loading} fallback={<Loader/>}>
                    <div className='table'>
                        <For each={transactions()[page()]}>{(tx, index) =>
                            <div className='table-data'>
                                <div className='table-column'>
                                    <Avatar id={tx?.userId} xp={tx.xp} height='30'/>
                                    <p className='white'>{tx?.username || 'Anonymous'}</p>
                                </div>

                                <div className='table-column'>
                                    <p>{tx?.operation}</p>
                                </div>

                                <div className='table-column'>
                                    <img src='/assets/icons/coin.svg' height='15' width='16' alt=''/>
                                    <p className='white'>
                                        {typeof tx.filledAmount === 'number' && (
                                            <>
                                                    <span className='gray'>
                                                        {(tx?.filledAmount || 0)?.toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}
                                                    </span>
                                                /
                                            </>
                                        )}
                                        {(tx?.totalAmount || 0)?.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </p>
                                </div>

                                <div className='table-column'>
                                    <button className='remove' onClick={async () => denyTX(tx)}>
                                        DENY
                                    </button>
                                </div>
                            </div>
                        }</For>
                    </div>
                </Show>

                <Pagination isLoading={isLoading()} loadedPages={loadedPages} loadPage={loadPage} page={page()}
                            total={total()} setPage={setPage} setParams={setParams}/>
            </div>

            <style jsx>{`
              .table {
                display: flex;
                flex-direction: column;
                margin-bottom: 20px;
              }

              .table-header, .table-data {
                display: flex;
                justify-content: space-between;
              }

              .table-header {
                margin: 0 0 20px 0;
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

              .table-column:nth-of-type(4n) {
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

              .view {
                background: unset;
                outline: unset;
                border: unset;

                display: flex;
                align-items: center;
                gap: 6px;

                color: #ADA3EF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 14px;
                font-weight: 700;

                cursor: pointer;
              }

              .users-wrapper {
                width: 100%;
              }

              .approve {
                outline: unset;
                border: unset;

                border-radius: 3px;
                background: #59E878;
                box-shadow: 0px 1px 0px 0px #3CAC54, 0px -1px 0px 0px #96FFAD;

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 14px;
                font-weight: 600;

                width: 78px;
                height: 33px;

                cursor: pointer;
              }

              .remove {
                outline: unset;
                border: unset;

                border-radius: 3px;
                background: #E2564D;
                box-shadow: 0px 1px 0px 0px #A1443E, 0px -1px 0px 0px #FF8D86;

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 14px;
                font-weight: 600;

                width: 78px;
                height: 33px;

                cursor: pointer;
              }
            `}</style>
        </>
    );
}

export default AdminRobuxCashier;
