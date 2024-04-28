import {A, Outlet, useLocation} from "@solidjs/router";
import {createResource, Show} from "solid-js";
import Loader from "../components/Loader/loader";
import {authedAPI} from "../util/api";
import {useUser} from "../contexts/usercontextprovider";
import Level from "../components/Level/level";
import {getUserNextLevel, progressToNextLevel, xpForLevel} from "../resources/levels";
import Avatar from "../components/Level/avatar";
import {Title} from "@solidjs/meta";

function Profile(props) {

    const location = useLocation()
    const [user] = useUser()
    const [stats, {mutate: mutateStats}] = createResource(fetchStats)

    async function fetchStats() {
        try {
            let stats = await authedAPI(`/user/${user()?.id}/profile`, 'GET', null)
            return mutateStats(stats)
        } catch (e) {
            console.log(e)
            return mutateStats(null)
        }
    }

    function getCurrentXP() {
        return Math.floor(user().xp - xpForLevel(user()?.xp || 0))
    }

    function getTotalXPForNext() {
        return Math.floor(getUserNextLevel(user()?.xp || 0) - xpForLevel(user()?.xp || 0))
    }

    function isActive(page) {
        return location?.pathname?.includes(page)
    }

    return (
        <>
            <Title>BloxClash | Profile</Title>

            <div class='profile-container fadein'>

                <div class='user-info'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="19" viewBox="0 0 16 19" fill="none">
                        <path d="M7.99971 0.104492C5.35299 0.104492 3.19971 2.25777 3.19971 4.90449C3.19971 7.55121 5.35299 9.70449 7.99971 9.70449C10.6464 9.70449 12.7997 7.55121 12.7997 4.90449C12.7997 2.25777 10.6464 0.104492 7.99971 0.104492Z" fill="#ADA3EF"/>
                        <path d="M13.9721 12.8403C12.658 11.506 10.9159 10.7712 9.06667 10.7712H6.93333C5.08416 10.7712 3.34201 11.506 2.02788 12.8403C0.720178 14.1681 0 15.9208 0 17.7756C0 18.0702 0.238791 18.309 0.533333 18.309H15.4667C15.7612 18.309 16 18.0702 16 17.7756C16 15.9208 15.2798 14.1681 13.9721 12.8403Z" fill="#ADA3EF"/>
                    </svg>

                    <p>
                        PROFILE -
                        &nbsp;<span class='gold id'>ACCOUNT ID</span>
                        &nbsp;<span class='id gray'>{user()?.id}</span>
                    </p>

                    <div class='user-display'>
                        <Avatar id={user()?.id} xp={user()?.xp} height='45'/>
                        <p>{user()?.username}</p>
                        <Level xp={user()?.xp}/>
                    </div>
                </div>

                <div className='bar' style={{margin: '25px 0 30px 0'}}/>

                <Show when={!stats.loading} fallback={<Loader/>}>
                    <div className='stats'>
                        <div className='stat'>
                            <p className='white align'>
                                <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                                {(stats()?.wagered || 0)?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </p>
                            <p>WAGERED</p>
                        </div>

                        <div className='stat'>
                            <p className='white align'>
                                <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                                {(stats()?.withdraws || 0)?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </p>
                            <p>WITHDRAWN</p>
                        </div>

                        <div className='stat'>
                            <p className='white align'>
                                <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                                {(stats()?.deposits || 0)?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </p>
                            <p>DEPOSITED</p>
                        </div>

                        <div className='stat green'>
                            <p className='white align'>
                                <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                                {((stats()?.withdraws - stats()?.deposits) || 0)?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </p>
                            <p class='green'>TOTAL PROFIT</p>
                        </div>
                    </div>
                </Show>

                <div class='bar' style={{margin: '30px 0 10px 0'}}/>

                <div class='user-level-container'>
                    <Level xp={xpForLevel(user()?.xp || 0)}/>
                    <div class='level-container'>
                        <div class='xp-bar' style={{width: `${100 - progressToNextLevel(user()?.xp || 0)}%`}}/>
                    </div>
                    <Level xp={getUserNextLevel(user()?.xp || 0)}/>

                    <p class='xp-progress'>
                        {getCurrentXP()?.toLocaleString()}
                        &nbsp;<span className='gold required'>/ {getTotalXPForNext()?.toLocaleString()} XP</span>
                    </p>
                </div>

                <div class='bar' style={{margin: '10px 0 25px 0'}}/>

                <div class='pages'>
                    <div class='bar' style={{margin: '0 4px 0 0'}}/>
                    <button class={'bevel-light page ' + (isActive('transactions') ? 'active' : '')}>
                        TRANSACTIONS
                        <A href='/profile/transactions' class='gamemode-link'></A>
                    </button>
                    <button class={'bevel-light page ' + (isActive('history') ? 'active' : '')}>
                        HISTORY
                        <A href='/profile/history' class='gamemode-link'></A>
                    </button>
                    <button class={'bevel-light page ' + (isActive('settings') ? 'active' : '')}>
                        SETTINGS
                        <A href='/profile/settings' class='gamemode-link'></A>
                    </button>
                </div>

                <Outlet/>
            </div>

            <style jsx>{`
              .profile-container {
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
              
              .user-info {
                display: flex;
                gap: 10px;
                align-items: center;

                color: #FFF;
                font-size: 18px;
                font-weight: 700;
              }
              
              .user-display {
                display: flex;
                gap: 10px;
                align-items: center;
                margin-left: auto;
                font-size: 14px;

              }
              
              .id {
                font-size: 14px;
              }
              
              .id.gray {
                color: #9F9AC8;
                font-weight: 500;
              }

              .stats {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }

              .stat {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                gap: 10px;

                flex: 1 1 0;
                height: 90px;

                border-radius: 5px;
                background: rgba(90, 84, 153, 0.27);

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 20px;
                font-weight: 600;

                padding: 10px 20px;
              }

              .stat.green {
                background: rgba(89, 232, 120, 0.15);
              }

              .stat p:last-child {
                color: #ADA3EF;
                font-size: 13px;
                font-weight: 600;
              }

              .align {
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .green {
                color: #59E878 !important;
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

              .user-level-container {
                display: flex;
                align-items: center;
                gap: 15px;
                width: 100%;
                position: relative;
              }

              .level-container {
                width: 100%;
                height: 15px;
                border-radius: 2525px;
                background: rgba(0, 0, 0, 0.24);
                padding: 4px;
              }

              .xp-bar {
                height: 100%;
                background: #6963A6;
                border-radius: 2525px;
              }

              .xp-progress {
                padding: 0 12px;
                height: 27px;
                line-height: 27px;
                text-align: center;

                border-radius: 2px;
                background: rgba(32, 30, 60, 0.6);

                position: absolute;
                left: 50%;
                transform: translateX(-50%);

                color: #FFF;
                font-size: 14px;
                font-weight: 700;
              }

              .required {
                font-size: 12px;
                font-weight: 600;
              }

              .pages {
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .page {
                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 13px;
                font-weight: 700;
                padding: 0 15px;
                height: 30px;
                position: relative;
                
                border: 1px solid transparent;;
                transition: all .2s;
              }
              
              .page.active {
                border: 1px solid #4A457D;
                background: #363262;
                color: white;
                box-shadow: unset;
              }

              @media only screen and (max-width: 1000px) {
                .profile-container {
                  padding-bottom: 90px;
                }
              }
            `}</style>
        </>
    );
}

export default Profile;
