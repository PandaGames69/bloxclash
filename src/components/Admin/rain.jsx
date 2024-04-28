import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";
import Loader from "../Loader/loader";
import AdminMFA from "../MFA/adminmfa";
import Avatar from "../Level/avatar";
import {useSearchParams} from "@solidjs/router";

function AdminRain(props) {

    const [username, setUsername] = createSignal('')
    const [amount, setAmount] = createSignal('')
    const [users, setUsers] = createSignal([])

    const [params, setParams] = useSearchParams()
    const [phrasesResource, {mutate: mutatePhrases, refetch: refetchPhrases }] = createResource(() => params?.search || '', fetchUsers)

    async function fetchUsers(search) {
        try {
            setUsername(search)
            let phrasesRes = await authedAPI(`/admin/rain${search ? `?search=${search}` : ''}`, 'GET', null)
            if (phrasesRes.error && phrasesRes.error === '2FA_REQUIRED') {
                return mutatePhrases({mfa: true})
            }

            setUsers(phrasesRes?.data)
            return mutatePhrases(phrasesRes)
        } catch (e) {
            console.log(e)
            return mutatePhrases(null)
        }
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
                            <p>USERNAME</p>
                        </div>

                        <div className='table-column'>
                            <p>AMOUNT</p>
                        </div>
                    </div>

                    <Show when={!phrasesResource.loading} fallback={<Loader/>}>
                        <div class='table'>
                            <For each={users()}>{(tipper, index) =>
                                <div className='table-data'>
                                    <div className='table-column'>
                                        <Avatar id={tipper?.id} xp={tipper.xp} height='30'/>
                                        <p class='white'>{tipper?.username || 'Anonymous'}</p>
                                    </div>

                                    <div className='table-column'>
                                        <img src='/assets/icons/coin.svg' height='15' width='16' alt=''/>
                                        <p className='white'>{(tipper?.amount || 0)?.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</p>
                                    </div>
                                </div>
                            }</For>
                        </div>
                    </Show>
                </div>

                <div class='filters'>
                    <div class='input-wrapper'>
                        <input placeholder='SEARCH FOR USER' value={username()} onInput={(e) => setUsername(e.target.value)}/>
                        <button class='search-button' onClick={() => setParams({ search: username() })}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                                <path d="M16.2987 17.8313L16.2988 17.8314C16.5039 18.0371 16.7798 18.15 17.0732 18.15C17.3511 18.15 17.6162 18.0476 17.818 17.8601C18.2484 17.4602 18.2624 16.7948 17.8478 16.3785L17.7415 16.4843L17.8478 16.3785L13.7547 12.2684C14.7979 11.0227 15.3686 9.47437 15.3686 7.86374C15.3686 3.99137 12.1072 0.85 8.10932 0.85C4.11147 0.85 0.85 3.99137 0.85 7.86374C0.85 11.7361 4.11147 14.8775 8.10932 14.8775C9.56844 14.8775 10.9619 14.4644 12.163 13.6786L16.2987 17.8313ZM8.10932 2.94054C10.929 2.94054 13.214 5.15409 13.214 7.86374C13.214 10.5734 10.929 12.7869 8.10932 12.7869C5.28964 12.7869 3.00461 10.5734 3.00461 7.86374C3.00461 5.15409 5.28964 2.94054 8.10932 2.94054Z" fill="#837EC1" stroke="#837EC1" stroke-width="0.3"/>
                            </svg>
                        </button>
                    </div>

                    <div className='input-wrapper dark'>
                        <input placeholder='ENTER AMOUNT...' type='number' value={amount()}
                               onInput={(e) => setAmount(e.target.valueAsNumber)}/>
                    </div>

                    <button class='bevel-light add' onClick={async () => {
                        let res = await authedAPI('/admin/rain/add', 'POST', JSON.stringify({
                            amount: amount()
                        }), true)

                        if (res?.success) {
                            createNotification('success', `Successfully added ${amount()} to the rain.`)
                            setAmount(0)
                        }
                    }}>ADD TO RAIN</button>

                    <button className='bevel-light remove' onClick={async () => {
                        let res = await authedAPI('/admin/rain/substract', 'POST', JSON.stringify({
                            amount: amount()
                        }), true)

                        if (res?.success) {
                            createNotification('success', `Successfully removed ${amount()} from the rain.`)
                            setAmount(0)
                        }
                    }}>SUBTRACT FROM RAIN
                    </button>
                </div>
            </div>

            <style jsx>{`
              .table {
                display: flex;
                flex-direction: column;
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
                font-weight: 600;

                width: 100%;
                height: 40px;
                
                cursor: pointer;
              }
              
              .add {
                height: 40px;

                border-radius: 3px;
                background: #59E878;
                box-shadow: 0px 1px 0px 0px #339548, 0px -1px 0px 0px #88FFA2;

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 14px;
                font-weight: 600;
              }
            `}</style>
        </>
    );
}

export default AdminRain;
