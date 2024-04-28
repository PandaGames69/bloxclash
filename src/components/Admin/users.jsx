import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";
import Loader from "../Loader/loader";
import AdminMFA from "../MFA/adminmfa";
import Avatar from "../Level/avatar";
import {useSearchParams} from "@solidjs/router";
import UserModal from "./usermodal";
import Pagination from "../Pagination/pagination";
import {addPage} from "../../util/pagination";

function AdminUsers(props) {

    let loadedPages = new Set()
    const [total, setTotal] = createSignal(1)
    const [page, setPage] = createSignal(1)
    const [isLoading, setIsLoading] = createSignal(true)

    const [username, setUsername] = createSignal('')

    const [params, setParams] = useSearchParams()
    const [users, setUsers] = createSignal([], { equals: false })
    const [usersResource, {mutate: mutateUsers, refetch: refetchUsers}] = createResource(() => params?.search || '', fetchUsers)
    const [user, {mutate: mutateUser, refetch: refetchUser}] = createResource(() => params.id, fetchUser)

    async function fetchUsers(search) {
        try {
            setUsername(search)
            setPage(+params?.page || 1)
            let users = await authedAPI(`/admin/users?page=${page()}${search ? `&search=${search}` : ''}`, 'GET', null)
            if (users.error && users.error === '2FA_REQUIRED') {
                return mutateUsers({mfa: true})
            }

            setTotal(users?.pages)
            addPage(users?.data, page(), setUsers)
            setIsLoading(false)
            return mutateUsers(users)
        } catch (e) {
            console.log(e)
            return mutateUsers(null)
        }
    }

    async function loadPage() {
        if (isLoading()) return
        setIsLoading(true)
        setParams({ page: page() })

        let moreData = await authedAPI(`/admin/users?page=${page()}${params?.search ? `&search=${params?.search}` : ''}`, 'GET', null)
        if (!moreData) return setIsLoading(false)

        addPage(moreData?.data, page(), setUsers)
        setTotal(moreData.pages)
        loadedPages.add(page())

        setIsLoading(false)
    }

    async function fetchUser(id) {
        try {
            if (!id) {
                return mutateUser(null)
            }
            let user = await authedAPI(`/admin/users/${id}`, 'GET', null)
            return mutateUser(user)
        } catch (e) {
            console.log(e)
            return mutateUser(null)
        }
    }

    function closeUserModal() {
        setParams({id: null})
        mutateUser(null)
    }

    return (
        <>
            {params.id && (
                <UserModal user={user()} loading={user.loading} close={closeUserModal}/>
            )}

            {usersResource()?.mfa && (
                <AdminMFA refetch={() => {
                    refetchUsers()
                    refetchUser()
                }}/>
            )}

            <div className='content'>
                <div class='users-wrapper'>
                    <div className='table-header'>
                        <div className='table-column'>
                            <p>USERNAME</p>
                        </div>

                        <div className='table-column'>
                            <p>RBX ID</p>
                        </div>

                        <div className='table-column'>
                            <p>BALANCE</p>
                        </div>

                        <div className='table-column'>
                            <p>OPTION</p>
                        </div>
                    </div>

                    <Show when={!usersResource.loading} fallback={<Loader/>}>
                        <div class='users'>
                            <For each={users()[page()]}>{(user, index) =>
                                <div className='table-data'>
                                    <div className='table-column'>
                                        <Avatar id={user?.id} xp={user.xp} height='30'/>
                                        <p class='white'>{user?.username || 'Anonymous'}</p>
                                    </div>

                                    <div className='table-column'>
                                        <p class='gold'>{user?.id}</p>
                                    </div>

                                    <div className='table-column'>
                                        <img src='/assets/icons/coin.svg' height='15' width='16' alt=''/>
                                        <p class='white'>{(user?.balance || 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>

                                    <div className='table-column'>
                                        <button class='view' onClick={() => setParams({id: user?.id})}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="11"
                                                 viewBox="0 0 17 11" fill="none">
                                                <path
                                                    d="M8.5 0.705902C5.25197 0.705902 2.30648 2.45951 0.133016 5.30782C-0.0443388 5.54118 -0.0443388 5.86719 0.133016 6.10055C2.30648 8.9523 5.25197 10.7059 8.5 10.7059C11.748 10.7059 14.6935 8.9523 16.867 6.10398C17.0443 5.87062 17.0443 5.54461 16.867 5.31126C14.6935 2.45951 11.748 0.705902 8.5 0.705902ZM8.733 9.22684C6.57691 9.36067 4.79641 7.60707 4.93203 5.47598C5.04332 3.71894 6.4865 2.29478 8.267 2.18497C10.4231 2.05113 12.2036 3.80474 12.068 5.93583C11.9532 7.68943 10.51 9.11359 8.733 9.22684ZM8.62519 7.60021C7.46369 7.67227 6.50389 6.72855 6.58039 5.58236C6.63951 4.63521 7.41848 3.86994 8.37829 3.80817C9.53979 3.7361 10.4996 4.67982 10.4231 5.82601C10.3605 6.7766 9.58152 7.54187 8.62519 7.60021Z"
                                                    fill="#ADA3EF"/>
                                            </svg>
                                            VIEW
                                        </button>
                                    </div>
                                </div>
                            }</For>
                        </div>
                    </Show>

                    <Pagination isLoading={isLoading()} loadedPages={loadedPages} loadPage={loadPage} page={page()} total={total()} setPage={setPage} setParams={setParams}/>
                </div>

                <div class='filters'>
                    <div class='search-wrapper'>
                        <input class='search' placeholder='SEARCH FOR USERS' value={username()} onInput={(e) => setUsername(e.target.value)}/>
                        <button class='search-button' onClick={() => setParams({ search: username() })}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                                <path d="M16.2987 17.8313L16.2988 17.8314C16.5039 18.0371 16.7798 18.15 17.0732 18.15C17.3511 18.15 17.6162 18.0476 17.818 17.8601C18.2484 17.4602 18.2624 16.7948 17.8478 16.3785L17.7415 16.4843L17.8478 16.3785L13.7547 12.2684C14.7979 11.0227 15.3686 9.47437 15.3686 7.86374C15.3686 3.99137 12.1072 0.85 8.10932 0.85C4.11147 0.85 0.85 3.99137 0.85 7.86374C0.85 11.7361 4.11147 14.8775 8.10932 14.8775C9.56844 14.8775 10.9619 14.4644 12.163 13.6786L16.2987 17.8313ZM8.10932 2.94054C10.929 2.94054 13.214 5.15409 13.214 7.86374C13.214 10.5734 10.929 12.7869 8.10932 12.7869C5.28964 12.7869 3.00461 10.5734 3.00461 7.86374C3.00461 5.15409 5.28964 2.94054 8.10932 2.94054Z" fill="#837EC1" stroke="#837EC1" stroke-width="0.3"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .users {
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

              .content {
                display: flex;
                gap: 35px;
              }
              
              .filters {
                width: 100%;
                max-width: 290px;
                
                display: flex;
                flex-direction: column;
              }
              
              .search-wrapper {
                width: 100%;
                height: 50px;
                
                display: flex;

                border-radius: 5px;
                background: rgba(0, 0, 0, 0.15);
              }
              
              .search {
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
              
              .search::placeholder {
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
              
              .users-wrapper {
                width: 100%;
              }
            `}</style>
        </>
    );
}

export default AdminUsers;
