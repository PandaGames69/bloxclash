import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";
import Loader from "../Loader/loader";
import AdminMFA from "../MFA/adminmfa";
import {useSearchParams} from "@solidjs/router";
import {addPage} from "../../util/pagination";
import Pagination from "../Pagination/pagination";

function AdminFilter(props) {

    let loadedPages = new Set()
    const [total, setTotal] = createSignal(1)
    const [page, setPage] = createSignal(1)
    const [isLoading, setIsLoading] = createSignal(true)

    const [phrase, setPhrase] = createSignal('')
    const [newPhrase, setNewPhrase] = createSignal('')
    const [phrases, setPhrases] = createSignal([], { equals: false })

    const [params, setParams] = useSearchParams()
    const [phrasesResource, {mutate: mutatePhrases, refetch: refetchPhrases }] = createResource(() => params?.search || '', fetchUsers)

    async function fetchUsers(search) {
        try {
            setPhrase(search)
            setPage(+params?.page || 1)
            let phrasesRes = await authedAPI(`/admin/phrases?page=${page()}${params?.search ? `&search=${params?.search}` : ''}`, 'GET', null)
            if (phrasesRes.error && phrasesRes.error === '2FA_REQUIRED') {
                return mutatePhrases({mfa: true})
            }

            setTotal(phrasesRes.pages)
            setIsLoading(false)
            addPage(phrasesRes?.data, page(), setPhrases)
            return mutatePhrases(phrasesRes)
        } catch (e) {
            console.log(e)
            return mutatePhrases(null)
        }
    }

    async function loadPage() {
        if (isLoading()) return
        setIsLoading(true)
        setParams({ page: page() })

        let moreData = await authedAPI(`/admin/phrases?page=${page()}${params?.search ? `&search=${params?.search}` : ''}`, 'GET', null)
        if (!moreData) return setIsLoading(false)

        addPage(moreData.data, page(), setPhrases)
        setTotal(moreData.pages)
        loadedPages.add(page())

        setIsLoading(false)
    }

    return (
        <>
            {phrasesResource()?.mfa && (
                <AdminMFA refetch={() => {
                    refetchPhrases()
                }}/>
            )}

            <div className='content'>
                <div class='phrases-wrapper'>
                    <div className='table-header'>
                        <div className='table-column'>
                            <p>PHRASE</p>
                        </div>

                        <div className='table-column'>
                            <p>OPTION</p>
                        </div>
                    </div>

                    <Show when={!phrasesResource.loading} fallback={<Loader/>}>
                        <div class='table'>
                            <For each={phrases()[page()]}>{(phrase, index) =>
                                <div className='table-data'>
                                    <div className='table-column'>
                                        <p>{phrase.phrase}</p>
                                    </div>

                                    <div className='table-column'>
                                        <button class='remove' onClick={async () => {
                                            let res = await authedAPI(`/admin/phrases/${phrase.id}/remove`, 'POST', null, true)

                                            if (res?.success) {
                                                createNotification('success', `Successfully removed ${phrase.phrase} from the word filter.`)
                                                setPhrases([
                                                    ...phrases().slice(0, index()),
                                                    ...phrases().slice(index() + 1)
                                                ])
                                            }
                                        }}>
                                            REMOVE
                                        </button>
                                    </div>
                                </div>
                            }</For>
                        </div>

                        <Pagination isLoading={isLoading()} loadedPages={loadedPages} loadPage={loadPage} page={page()} total={total()} setPage={setPage} setParams={setParams}/>
                    </Show>
                </div>

                <div class='filters'>
                    <div class='input-wrapper'>
                        <input placeholder='SEARCH FOR PHRASE' value={phrase()} onInput={(e) => setPhrase(e.target.value)}/>
                        <button class='search-button' onClick={() => setParams({ search: phrase() })}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                                <path d="M16.2987 17.8313L16.2988 17.8314C16.5039 18.0371 16.7798 18.15 17.0732 18.15C17.3511 18.15 17.6162 18.0476 17.818 17.8601C18.2484 17.4602 18.2624 16.7948 17.8478 16.3785L17.7415 16.4843L17.8478 16.3785L13.7547 12.2684C14.7979 11.0227 15.3686 9.47437 15.3686 7.86374C15.3686 3.99137 12.1072 0.85 8.10932 0.85C4.11147 0.85 0.85 3.99137 0.85 7.86374C0.85 11.7361 4.11147 14.8775 8.10932 14.8775C9.56844 14.8775 10.9619 14.4644 12.163 13.6786L16.2987 17.8313ZM8.10932 2.94054C10.929 2.94054 13.214 5.15409 13.214 7.86374C13.214 10.5734 10.929 12.7869 8.10932 12.7869C5.28964 12.7869 3.00461 10.5734 3.00461 7.86374C3.00461 5.15409 5.28964 2.94054 8.10932 2.94054Z" fill="#837EC1" stroke="#837EC1" stroke-width="0.3"/>
                            </svg>
                        </button>
                    </div>

                    <div className='input-wrapper dark'>
                        <input placeholder='ENTER A PHRASE...' value={newPhrase()}
                               onInput={(e) => setNewPhrase(e.target.value)}/>
                    </div>

                    <button class='bevel-light add' onClick={async () => {
                        let res = await authedAPI('/admin/phrases/add', 'POST', JSON.stringify({
                            phrase: newPhrase()
                        }), true)

                        if (res?.success) {
                            createNotification('success', `Successfully added ${newPhrase()} to the word filter.`)
                            refetchPhrases()
                            setNewPhrase('')
                        }
                    }}>ADD PHRASE</button>
                </div>
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

              .table-column:nth-of-type(2n) {
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

              .content {
                display: flex;
                gap: 35px;
              }
              
              .filters {
                width: 100%;
                max-width: 290px;
                
                display: flex;
                flex-direction: column;
                gap: 10px;
              }
              
              .input-wrapper {
                width: 100%;
                height: 50px;
                
                display: flex;

                border-radius: 5px;
                background: rgba(0, 0, 0, 0.15);
              }
              
              .input-wrapper.dark {
                border: 1px solid #443F7D;
                background: rgba(0, 0, 0, 0.25);
              }
              
              .input-wrapper input {
                width: 100%;
                height: 100%;
                
                background: unset;
                border: unset;
                outline: unset;

                color: white;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 15px;
                font-weight: 700;
                
                padding: 0 15px;
              }
              
              .input-wrapper input::placeholder {
                color: #837EC1;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 15px;
                font-weight: 700;
              }
              
              .search-button {
                height: 100%;
                min-width: 50px;
                
                outline: unset;
                border: unset;
                
                background: rgba(0, 0, 0, 0.12);
                cursor: pointer;
              }
              
              .phrases-wrapper {
                width: 100%;
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
                font-weight: 700;

                width: 78px;
                height: 33px;
                
                cursor: pointer;
              }
              
              .add {
                height: 40px;

                font-family: Geogrotesque Wide, sans-serif;
                font-size: 15px;
                font-weight: 600;
              }
            `}</style>
        </>
    );
}

export default AdminFilter;
