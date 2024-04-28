import Games from "./games";
import {A, useSearchParams} from "@solidjs/router";
import {createEffect, createSignal} from "solid-js";
import Level from "../Level/level";
import Circularprogress from "../Level/circularprogress";
import {progressToNextLevel} from "../../resources/levels";
import BottomNavBar from "./mobilenav";
import UserDropdown from "./userdropdown";
import {addDropdown, logout} from "../../util/api";
import {useWebsocket} from "../../contexts/socketprovider";
import Countup from "../Countup/countup";
import Notifications from "./notifications";

function NavBar(props) {

    const [searchParams, setSearchParams] = useSearchParams()
    const [userDropdown, setUserDropdown] = createSignal(false)
    const [balanceDropdown, setBalanceDropdown] = createSignal(false)
    const [wagered, setWagered] = createSignal(0)
    const [ws] = useWebsocket()

    addDropdown(setUserDropdown)

    createEffect(() => {
        if (ws() && ws().connected) {
            ws().on('totalWagered', (amt) => setWagered(amt))
        }
    })

    return (
        <>
            <div class='navbar-container'>
                <div class='header-navbar'>
                    <div class='content'>
                        <div class='totalbets'>
                            <img src='/assets/icons/coin.svg' height='15' alt=''/>
                            <p><span class='gold'>{Math.floor(wagered() || 0)?.toLocaleString()}</span> WAGERED</p>
                        </div>

                        {props?.user && (
                            <div class='rewards-wrapper'>
                                <button className='rewards' onClick={() => setSearchParams({modal: 'rakeback'})}>
                                    <img src='/assets/icons/rakeback.svg' height='12' width='10' alt=''/>
                                    <p>REWARDS</p>
                                </button>
                                <button className='bevel-purple surveys'>
                                    <img src='/assets/icons/surveys.svg' height='11' width='8' alt=''/>
                                    SURVEYS
                                    <A href='/surveys' class='gamemode-link'></A>
                                </button>
                            </div>
                        )}

                        <div class='extralinks'>
                            <p class='leaderboard link'><A href='/leaderboard'>LEADERBOARD</A></p>

                            {props.user && (
                                <p class='affiliates link'><A href='/affiliates'>AFFILIATES</A></p>
                            )}

                            <p class='link'><A href='/docs/provably'>FAIRNESS</A></p>
                            <p class='link'><A href='/docs/faq'>FAQ</A></p>
                            <p class='link'><A href='/docs/tos'>TOS</A></p>
                            <p class='link'><A href='/docs/aml'>AML</A></p>
                            <p class='link'><A href='/docs/privacy'>PRIVACY</A></p>

                            {props.user && (
                                <p class='logout link' onClick={() => logout()}>LOGOUT</p>
                            )}
                        </div>
                    </div>
                </div>

                <div class='main-navbar'>
                    <div class='content between'>
                        <div class='logo-wrapper'>
                            <img src='/assets/logo/small.png' alt='' height='35'/>
                            <A href='/' class='gamemode-link'></A>
                        </div>

                        <div class='links'>
                            <button class='bevel-gold home'>
                                <A href='/' class='gamemode-link'></A>
                            </button>

                            <Games/>
                        </div>

                        {props.user && (
                            <div class='balance-container'>
                                <div class='balance-hover'>
                                    <div className='robux'>
                                        <img className='coin' src='/assets/icons/coin.svg' height='18'/>
                                        <p>
                                            <Countup end={props?.user?.balance} gray={true}/>
                                        </p>
                                    </div>

                                    <p className='fiat'>
                                        <span class='gold'>$ </span><Countup end={props?.user?.balance / 1000 * 3.5}
                                                                             gray={true}/>
                                    </p>
                                </div>

                                <button class='deposit-button' onClick={() => setBalanceDropdown(!balanceDropdown())}>
                                    <img src='/assets/icons/wallet.svg' alt='Market'/>
                                </button>

                                <div class={'deposit-dropdown ' + (balanceDropdown() ? 'active' : '')}>
                                    <div class='decoration-arrow'/>
                                    <div class='dropdown-links'>
                                        <A href='/deposit' class='user-dropdown-link gold'
                                           onClick={() => setBalanceDropdown(false)}>
                                            <img src='/assets/icons/coin.svg' height='16'/>
                                            Deposit
                                        </A>
                                        <A href='/withdraw' class='user-dropdown-link'
                                           onClick={() => setBalanceDropdown(false)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="11"
                                                 viewBox="0 0 14 11" fill="none">
                                                <path
                                                    d="M14 3.79815C14.0003 3.85957 13.9886 3.92045 13.9654 3.97731C13.9421 4.03417 13.9079 4.08588 13.8647 4.12949L11.0647 6.92948C11.0211 6.97273 10.9693 7.00695 10.9125 7.03018C10.8556 7.0534 10.7947 7.06517 10.7333 7.06482C10.6727 7.06556 10.6124 7.05446 10.556 7.03215C10.47 6.99684 10.3966 6.93667 10.345 6.85935C10.2935 6.78203 10.2662 6.69108 10.2667 6.59815V5.19815H6.06667C5.9429 5.19815 5.8242 5.14899 5.73668 5.06147C5.64917 4.97395 5.6 4.85525 5.6 4.73149V2.86482C5.6 2.74105 5.64917 2.62236 5.73668 2.53484C5.8242 2.44732 5.9429 2.39816 6.06667 2.39816H10.2667V0.998157C10.267 0.905863 10.2948 0.815756 10.3464 0.739231C10.398 0.662705 10.4711 0.603198 10.5565 0.568232C10.6419 0.533267 10.7358 0.524415 10.8263 0.542795C10.9167 0.561174 10.9997 0.605961 11.0647 0.671491L13.8647 3.47149C13.9509 3.55841 13.9995 3.67573 14 3.79815ZM7.93333 6.13148H3.73334V4.73149C3.73288 4.63935 3.70516 4.54942 3.65367 4.47302C3.60218 4.39661 3.52923 4.33716 3.444 4.30215C3.35902 4.26642 3.26535 4.25665 3.17482 4.27409C3.0843 4.29153 3.00096 4.3354 2.93534 4.40015L0.135341 7.20015C0.0920897 7.24376 0.0578713 7.29547 0.0346478 7.35233C0.0114244 7.40918 -0.000347283 7.47007 7.79999e-06 7.53148C-0.000347283 7.5929 0.0114244 7.65378 0.0346478 7.71064C0.0578713 7.7675 0.0920897 7.81921 0.135341 7.86282L2.93534 10.6628C2.97894 10.7061 3.03066 10.7403 3.08751 10.7635C3.14437 10.7867 3.20525 10.7985 3.26667 10.7981C3.32789 10.7997 3.38862 10.7869 3.444 10.7608C3.52923 10.7258 3.60218 10.6664 3.65367 10.5899C3.70516 10.5135 3.73288 10.4236 3.73334 10.3315V8.93148H7.93333C8.0571 8.93148 8.1758 8.88231 8.26332 8.7948C8.35083 8.70728 8.4 8.58858 8.4 8.46482V6.59815C8.4 6.47438 8.35083 6.35568 8.26332 6.26817C8.1758 6.18065 8.0571 6.13148 7.93333 6.13148Z"
                                                    fill="#ADA3EF"/>
                                            </svg>
                                            Withdraw
                                        </A>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div class='user-container'>
                            {props.user ? (
                                <>
                                    <Notifications/>

                                    <div class='user-dropdown-minified'>
                                        <Circularprogress progress={progressToNextLevel(props?.user?.xp || 0)}>
                                            <div class='avatar'>
                                                <img
                                                    src={`${import.meta.env.VITE_SERVER_URL}/user/${props.user?.id}/img`}
                                                    width='31' height='31'/>
                                            </div>
                                        </Circularprogress>
                                    </div>

                                    <div class={'user-dropdown-wrapper ' + (userDropdown() ? 'active' : '')}
                                         onClick={(e) => {
                                             setUserDropdown(!userDropdown())
                                             e.stopPropagation()
                                         }}>
                                        <div class='avatar-wrapper'>
                                            <Circularprogress progress={progressToNextLevel(props?.user?.xp || 0)}>
                                                <div class='avatar'>
                                                    <img
                                                        src={`${import.meta.env.VITE_SERVER_URL}/user/${props.user?.id}/img`}
                                                        width='31' height='31'/>
                                                </div>
                                            </Circularprogress>
                                        </div>

                                        <svg class='arrow' width="7" height="5" viewBox="0 0 7 5" fill="none"
                                             xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M3.50001 0.994671C3.62547 0.994671 3.7509 1.04269 3.84655 1.13852L6.8564 4.15579C7.04787 4.34773 7.04787 4.65892 6.8564 4.85078C6.66501 5.04263 6.5 4.99467 6.16316 4.99467L3.50001 4.99467L1 4.99467C0.5 4.99467 0.335042 5.04254 0.14367 4.85068C-0.0478893 4.65883 -0.0478893 4.34764 0.14367 4.1557L3.15347 1.13843C3.24916 1.04258 3.3746 0.994671 3.50001 0.994671Z"
                                                fill="#9489DB"/>
                                        </svg>

                                        <UserDropdown user={props?.user} active={userDropdown()}
                                                      setActive={setUserDropdown}/>
                                    </div>
                                </>
                            ) : (
                                <button class='bevel-gold signin' onClick={() => setSearchParams({modal: 'login'})}>SIGN
                                    IN</button>
                            )}
                        </div>
                    </div>
                </div>

                <div class='bar'/>

                <BottomNavBar chat={props.chat} setChat={props.setChat}/>
            </div>

            <style jsx>{`
              .navbar-container {
                width: 100%;
                height: fit-content;
                z-index: 3;
                position: sticky;
                top: 0;
              }

              .header-navbar {
                width: 100%;
                height: 43px;

                background: #262147;

                display: flex;
                align-items: center;

                padding: 0 25px;
              }

              .main-navbar {
                width: 100%;
                height: 85px;

                background: rgba(45, 39, 85, 0.9);
                box-shadow: 0px 3px 4px rgba(123, 120, 182, 0.1);

                display: flex;
                align-items: center;

                padding: 0 25px;
              }

              .content {
                width: 100%;
                max-width: 1175px;
                margin: 0 auto;

                display: flex;
                align-items: center;
                gap: 20px;
              }

              .content.between {
                justify-content: space-between;
              }

              .balance-container {
                height: 45px;
                min-width: 160px;
                padding: 0 0 0 15px;
                gap: 10px;
                font-variant-numeric: tabular-nums;

                align-items: center;
                display: flex;

                border-radius: 5px;
                border: 1px solid #866FEA;
                background: radial-gradient(60% 60% at 50% 50%, rgba(147, 126, 236, 0.15) 0%, rgba(102, 83, 184, 0.15) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);
                box-shadow: 0px 0px 35px 0px rgba(180, 22, 255, 0.10), 0px 1px 5px 0px rgba(0, 0, 0, 0.25) inset;

                position: absolute;
                left: 50%;
                transform: translateX(-50%);

                font-family: 'Geogrotesque Wide';
                color: white;
                font-weight: 700;
                font-size: 14px;
              }

              .balance-container > * {
                position: relative;
              }

              .balance-hover {
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;

                width: 100%;

                cursor: pointer;
              }

              .balance-hover:hover .robux {
                opacity: 0;
              }

              .balance-hover:hover .fiat {
                opacity: 1;
              }
              
              .rewards-wrapper {
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .rewards {
                border-radius: 3px;
                border: 1px solid #B17818;
                background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);

                height: 25px;
                padding: 0 10px;
                cursor: pointer;

                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;

                font-family: Geogrotesque Wide, sans-serif;
                font-size: 12px;
                font-weight: 700;
              }

              .rewards > p {
                background: linear-gradient(53deg, #F90 54.58%, #F9AC39 69.11%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              
              .surveys {
                height: 24px;
                padding: 0 8px;
                
                color: #2D2852;
                font-size: 12px;
                font-weight: 700;
                
                display: flex;
                align-items: center;
                gap: 4px;
                
                position: relative;
              }

              .robux {
                display: flex;
                gap: 8px;
              }

              .fiat, .robux {
                transition: opacity .3s;
              }

              .fiat {
                position: absolute;
                opacity: 0;
              }

              .cents {
                color: #A7A7A7;
              }

              .deposit-button {
                outline: unset;
                border: unset;

                height: 41px;
                width: 40px;
                min-width: 40px;

                border-radius: 4px;
                background: radial-gradient(60% 60% at 50% 50%, #937EEC 0%, #6653B8 100%);
                box-shadow: 0px 1.79879px 0px 0px #4E408B, 0px -1.79879px 0px 0px #8470DF;

                font-family: 'Geogrotesque Wide', sans-serif;
                color: white;
                font-weight: 700;
                font-size: 14px;

                cursor: pointer;
              }

              .deposit-dropdown {
                position: absolute !important;
                top: 64px;
                right: 0;

                width: 100%;
                max-width: 180px;

                max-height: 0px;
                overflow: hidden;
                transition: max-height .3s;
              }

              .deposit-dropdown.active {
                max-height: 100px;
              }

              .decoration-arrow {
                width: 13px;
                height: 9px;

                top: 3px;
                background: #26214A;
                position: absolute;
                right: 0;

                border-left: 1px solid #3A336D;
                border-right: 1px solid #3A336D;
                border-top: 1px solid #3A336D;

                clip-path: polygon(0% 100%, 100% 0%, 100% 100%);
              }

              .dropdown-links {
                width: 100%;
                background: #26214A;
                border: 1px solid #3A336D;
                margin-top: 10px;
                padding: 10px;
                border-radius: 5px;

                display: flex;
                flex-direction: column;
                gap: 8px;
              }

              .user-container {
                display: flex;
                gap: 8px;
                height: 100%;
              }

              .user-dropdown-wrapper {
                display: flex;
                align-items: center;
                height: 43px;
                position: relative;

                gap: 8px;

                font-family: 'Geogrotesque Wide', sans-serif;
                font-weight: 700;
                font-size: 14px;

                color: #ADA3EF;
                cursor: pointer;
              }

              .avatar-wrapper {
                background: #413976;
                border: 1px solid rgba(62, 53, 128, 0.35);
                box-shadow: 0px -1px 0px #5B509E, 0px 1px 0px #282445;
                border-radius: 4px;

                display: flex;
                align-items: center;
                justify-content: center;

                height: 100%;
                aspect-ratio: 1;
              }

              .user-dropdown-wrapper.active svg {
                transform: rotate(180deg);
              }

              .avatar {
                position: relative;
                height: 35px;
                width: 35px;
                overflow: hidden;

                display: flex;
                align-items: center;
                justify-content: center;

                border-radius: 3px;
              }

              .avatar img {
                position: relative;
                z-index: 1;
                border-radius: 3px;
              }

              .avatar:before {
                width: 31px;
                height: 31px;

                content: '';

                position: absolute;
                top: 2px;
                left: 2px;

                background: #413976;
                z-index: 1;
                border-radius: 3px;
              }

              .home {
                border: unset;
                outline: unset;
                padding: unset;
                position: relative;

                height: 43px;
                width: 43px;

                background-image: url('/assets/icons/house.svg');
                background-repeat: no-repeat;
                background-position: center;

                display: flex;
                align-items: center;
                justify-content: center;

                cursor: pointer;
              }

              .signin {
                border: unset;
                outline: unset;
                padding: unset;

                height: 43px;
                width: 115px;

                font-family: 'Geogrotesque Wide';
                font-weight: 600;
                font-size: 14px;
                color: white;

                cursor: pointer;
              }

              .links {
                display: flex;
                align-items: center;
                gap: 12px;
              }

              .totalbets {
                display: flex;
                gap: 10px;
                align-items: center;

                font-family: 'Geogrotesque Wide';
                font-weight: 700;
                font-size: 13px;

                color: #9A90D1;
              }

              .extralinks {
                display: flex;
                margin-left: auto;
                gap: 10px;
              }

              .link {
                font-family: 'Geogrotesque Wide';
                font-style: normal;
                font-weight: 700;
                font-size: 13px;

                background: #9A90D1;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-fill-color: transparent;
                opacity: 0.75;
                transition: opacity .3s;
                text-decoration: none;
              }

              .affiliates {
                background: #59E878;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-fill-color: transparent;
                opacity: 1;
              }

              .link:hover {
                opacity: 1;
              }

              .logout {
                opacity: 0.5;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-fill-color: transparent;
                cursor: pointer;
              }

              .logout:hover {
                opacity: 0.75;
              }

              .leaderboard {
                background: linear-gradient(53.13deg, #FF9900 54.58%, #F9AC39 69.11%);
                opacity: 1;

                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-fill-color: transparent;
              }

              .bar {
                width: 100%;
                height: 1px;
                background: linear-gradient(90deg, #7435FA 0%, #435DE8 163.22%);
              }

              .logo-wrapper {
                display: none;
                position: relative;
              }

              .user-dropdown-minified {
                display: none;
              }

              @media only screen and (max-width: 1000px) {
                .header-navbar, .links, .user-dropdown-wrapper, .withdraw {
                  display: none;
                }

                .logo-wrapper, .user-dropdown-minified {
                  display: block;
                }

                .balance-container {
                  height: 35px;
                  font-size: 10px;

                  left: unset;
                  position: relative;
                  transform: unset;
                }

                .deposit-button {
                  height: 31px;
                  font-size: 10px;
                }

                .coin {
                  height: 15px;
                }
              }

              @media only screen and (max-width: 375px) {
                .logo-wrapper {
                  display: none;
                }
              }
            `}</style>
        </>
    );
}

export default NavBar;
