import {A, useSearchParams} from "@solidjs/router";
import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI} from "../../util/api";
import Loader from "../Loader/loader";
import NumberPrefix from "../Transactions/prefix";
import Pagination from "../Pagination/pagination";

function History(props) {

  let loadedPages = new Set()
  const [total, setTotal] = createSignal(1)
  const [page, setPage] = createSignal(1)

  const [searchParams, setSearchParams] = useSearchParams()
  const [bets, setBets] = createSignal([], {equals: false})
  const [historyData, {mutate: mutateHistory}] = createResource(() => searchParams.filter || '', fetchHistory)
  const [isLoading, setIsLoading] = createSignal(true)

  async function fetchHistory() {
    try {
      setPage(+searchParams?.page || 1)
      let historyRes = await authedAPI(`/user/bets?page=${page()}${queryParams()}`, 'GET', null)

      setIsLoading(false)
      setTotal(historyRes?.pages)
      addPage(historyRes?.data)
      return mutateHistory(historyRes)
    } catch (e) {
      console.log(e)
      setIsLoading(false)
      return mutateHistory(null)
    }
  }

  function isActive(filter) {
    if (filter === '') return !searchParams?.filter || searchParams?.filter === filter

    return searchParams?.filter === filter
  }

  function queryParams() {
    let params = ''

    switch (searchParams?.filter || '') {
      case 'cases':
        params += `&games=case`
        break
      case 'battles':
        params += `&games=battle`
        break
      default:
        if (!searchParams?.filter) return params
        params += `&games=${searchParams?.filter}`
        break
    }

    return params
  }

  function addPage(data) {
    return setBets(bets => {
      bets[page()] = data
      return bets
    })
  }

  async function loadPage() {
    if (isLoading()) return
    setIsLoading(true)
    setSearchParams({page: page()})

    let moreData = await authedAPI(`/user/bets?page=${page()}${queryParams()}`, 'GET', null)
    if (!moreData) return setIsLoading(false)

    addPage(moreData.data)
    setTotal(moreData.pages)
    loadedPages.add(page())

    setIsLoading(false)
  }

  return (
    <>
      <div class='historycontainer fadein'>
        <div class='tabs'>
          <button class={'bevel-light tab ' + (isActive('') ? 'active' : '')}
                  onClick={() => setSearchParams({filter: '', page: 1})}>ALL
          </button>
          <button class={'bevel-light tab ' + (isActive('cases') ? 'active' : '')}
                  onClick={() => setSearchParams({filter: 'cases', page: 1})}>CASES
          </button>
          <button class={'bevel-light tab ' + (isActive('battles') ? 'active' : '')}
                  onClick={() => setSearchParams({filter: 'battles', page: 1})}>CASE BATTLES
          </button>
          <button class={'bevel-light tab ' + (isActive('coinflip') ? 'active' : '')}
                  onClick={() => setSearchParams({filter: 'coinflip', page: 1})}>COINFLIP
          </button>
          <button class={'bevel-light tab ' + (isActive('jackpot') ? 'active' : '')}
                  onClick={() => setSearchParams({filter: 'jackpot', page: 1})}>JACKPOT
          </button>
          <button class={'bevel-light tab ' + (isActive('roulette') ? 'active' : '')}
                  onClick={() => setSearchParams({filter: 'roulette', page: 1})}>ROULETTE
          </button>
          <button class={'bevel-light tab ' + (isActive('crash') ? 'active' : '')}
                  onClick={() => setSearchParams({filter: 'crash', page: 1})}>CRASH
          </button>
        </div>

        <div class='bar' style={{margin: '25px 0 20px 0'}}/>

        <Show when={!historyData.loading} fallback={<Loader/>}>
          <>
            <div class='table'>
              <div class='table-header'>
                <div class='table-column'>
                  <p>GAME</p>
                </div>

                <div class='table-column'>
                  <p>VERIFY</p>
                </div>

                <div class='table-column'>
                  <p>DATE</p>
                </div>

                <div class='table-column'>
                  <p>WAGER</p>
                </div>

                <div class='table-column'>
                  <p>PROFIT</p>
                </div>
              </div>

              <For each={bets()[page()]}>{(bet, index) => (
                <div class='table-data'>
                  <div class='table-column'>
                    <p class='white bold'>{bet?.game}</p>
                  </div>

                  <div class='table-column'>
                    {bet?.game !== 'slot' && (
                      <button className='verify'>
                        VERIFY
                        <A href='/docs/provably' class='gamemode-link'></A>
                      </button>
                    )}
                  </div>

                  <div class='table-column'>
                    <p>{new Date(bet?.createdAt || 0)?.toLocaleString([], {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}</p>
                  </div>

                  <div class='table-column'>
                    <img src='/assets/icons/coin.svg' height='17' width='17'/>
                    <p class='white bold'>{bet?.amount?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}</p>
                  </div>

                  <div class='table-column'>
                    <NumberPrefix amount={(bet?.winnings - bet?.amount || 0)}/>
                    <img src='/assets/icons/coin.svg' height='17' width='17'/>
                    <p class='white bold'>{Math.abs(bet?.winnings - bet?.amount || 0)?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}</p>
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
        .historycontainer {
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

        .verify {
          outline: unset;
          border: unset;

          width: 70px;
          height: 25px;

          padding: unset;
          margin: unset;

          border-radius: 3px;
          background: #24DD4C;
          box-shadow: 0px 1px 0px 0px #308041, 0px -1px 0px 0px #88FFA2;
          position: relative;

          color: #FFF;
          font-family: "Geogrotesque Wide", sans-serif;
          font-size: 12px;
          font-weight: 700;

          cursor: pointer;
        }

        .verify:active {
          box-shadow: unset;
        }

        .green {
          color: #24DD4C;
        }

        @media only screen and (max-width: 1000px) {
          .historycontainer {
            padding-bottom: 90px;
          }
        }
      `}</style>
    </>
  );
}

export default History;
