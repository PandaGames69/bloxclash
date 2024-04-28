import {A} from "@solidjs/router";
import {createSignal} from "solid-js";
import {addDropdown, logout} from "../../util/api";
import UserDropdown from "./userdropdown";

function BottomNavBar(props) {

    const [menuDropdown, setMenuDropdown] = createSignal(false)
    const [active, setActive] = createSignal(false)
    addDropdown(setActive)

    return (
        <>
            <div class='bottom-navbar'>
                <button class='button' onClick={(e) => {
                    e.stopPropagation()
                    setMenuDropdown(!menuDropdown())
                }}>
                    <svg width="17" height="14" viewBox="0 0 17 14" fill="#6B639D" xmlns="http://www.w3.org/2000/svg">
                        <g id="Group 1359">
                            <rect id="Rectangle 129" width="17" height="2" rx="1"/>
                            <rect id="Rectangle 130" y="6" width="17" height="2" rx="1"/>
                            <rect id="Rectangle 131" y="12" width="17" height="2" rx="1"/>
                        </g>
                    </svg>

                    <p>MENU</p>

                    <UserDropdown user={props?.user} active={menuDropdown()} setActive={setMenuDropdown} mobile={true}/>
                </button>

                <button class={'button ' + (active() ? 'active' : '')} onClick={(e) => {
                    e.stopPropagation()
                    setActive(!active())
                }}>
                    <svg width="17" height="18" viewBox="0 0 17 18" fill="#6B639D" xmlns="http://www.w3.org/2000/svg">
                        <g id="Group">
                            <path id="Vector" d="M0 5.21919V8.74722L3.21992 10.6065V6.88679L0.0123047 5.03522C0.0041836 5.09576 0 5.15721 0 5.21919V5.21919Z" />
                            <path id="Vector_2" d="M4.27441 11.2155L7.49757 13.0766V9.35621L4.27441 7.49564V11.2155Z" />
                            <path id="Vector_3" d="M8.02491 4.72238L4.80225 6.58246L8.02491 8.44275L11.2476 6.58246L8.02491 4.72238Z" />
                            <path id="Vector_4" d="M8.55225 13.0766L11.7754 11.2155V7.49564L8.55225 9.35621V13.0766Z" />
                            <path id="Vector_5" d="M16.0377 5.03522L12.8301 6.88679V10.6065L16.05 8.74722V5.21919C16.05 5.15721 16.0458 5.09576 16.0377 5.03522V5.03522Z" />
                            <path id="Vector_6" d="M15.3566 4.01729C14.6183 3.59063 13.4794 2.93279 12.3028 2.25333L9.08008 4.11344L12.3027 5.97352L15.5115 4.12124C15.4626 4.08342 15.4109 4.04858 15.3566 4.01729V4.01729Z" />
                            <path id="Vector_7" d="M11.2478 1.6444C10.2906 1.09181 9.38102 0.566788 8.71917 0.185097C8.5051 0.0616991 8.26502 0 8.02494 0C7.78482 0 7.54471 0.0616991 7.33053 0.185168C6.68327 0.559194 5.77108 1.08583 4.80273 1.64478L8.0249 3.50461L11.2478 1.6444Z" />
                            <path id="Vector_8" d="M3.74829 2.25372C2.59032 2.92215 1.45836 3.5756 0.694418 4.01705C0.63989 4.04848 0.588105 4.08343 0.539062 4.12139L3.7478 5.97363L6.97043 4.11356L3.74829 2.25372Z" />
                            <path id="Vector_9" d="M0 12.8841C0 13.3789 0.265816 13.8394 0.693666 14.086L0.694194 14.0863C1.34131 14.4602 2.25253 14.9863 3.21992 15.5448V11.8243L0 9.96509V12.8841Z" />
                            <path id="Vector_10" d="M4.27441 16.1536C5.43334 16.8225 6.56649 17.4767 7.33103 17.9184C7.38503 17.9495 7.44068 17.9767 7.49757 18V14.2944L4.27441 12.4333V16.1536Z" />
                            <path id="Vector_11" d="M8.55225 17.9999C8.6093 17.9766 8.66513 17.9494 8.71927 17.9181C9.50188 17.4668 10.631 16.815 11.7754 16.1543V12.4333L8.55225 14.2944V17.9999Z" />
                            <path id="Vector_12" d="M12.8301 15.5452C13.8128 14.9777 14.7288 14.4485 15.3558 14.0862C15.7842 13.8393 16.05 13.3788 16.05 12.884V9.965L12.8301 11.8242V15.5452H12.8301Z" />
                        </g>
                    </svg>

                    <p>GAMES</p>

                    <div class={'dropdown ' + (active() ? 'active' : '')} onClick={(e) => e.stopPropagation()}>
                        <div class='dropdown-container'>
                            <div class='gamemode'
                                 style={{'background-image': 'url("/assets/gamemodes/coinflip.png")'}}>
                                <A href='/coinflip' class='gamemode-link' onClick={() => setActive(false)}>
                                    <p class='name'>COINFLIP</p>
                                </A>
                            </div>

                            <div className='gamemode'
                                 style={{'background-image': 'url("/assets/gamemodes/slots.png")'}}>
                                <A href='/slots' class='gamemode-link' onClick={() => setActive(false)}>
                                    <p className='name'>SLOTS</p>
                                </A>
                            </div>

                            <div className='gamemode'
                                 style={{'background-image': 'url("/assets/gamemodes/mines.png")'}}>
                                <A href='/mines' class='gamemode-link' onClick={() => setActive(false)}>
                                    <p className='name'>MINES</p>
                                </A>
                            </div>

                            <div class='gamemode'
                                 style={{'background-image': 'url("/assets/gamemodes/jackpot.png")'}}>
                                <A href='/jackpot' class='gamemode-link' onClick={() => setActive(false)}>
                                    <p class='name'>JACKPOT</p>
                                </A>
                            </div>

                            <div class='gamemode'
                                 style={{'background-image': 'url("/assets/gamemodes/cases.png")'}}>
                                <A href='/cases' class='gamemode-link' onClick={() => setActive(false)}>
                                    <p class='name'>CASES</p>
                                </A>
                            </div>

                            <div class='gamemode'
                                 style={{'background-image': 'url("/assets/gamemodes/battles.png")'}}>
                                <A href='/battles' class='gamemode-link' onClick={() => setActive(false)}>
                                    <p class='name'>CASE BATTLES</p>
                                </A>
                            </div>

                            <div class='gamemode'
                                 style={{'background-image': 'url("/assets/gamemodes/roulette.png")'}}>
                                <A href='/roulette' class='gamemode-link' onClick={() => setActive(false)}>
                                    <p class='name'>ROULETTE</p>
                                </A>
                            </div>
                        </div>
                        <div class='decoration-arrow'/>
                    </div>
                </button>

                <button class='button' onClick={() => props.setChat(!props.chat)}>
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="#6B639D" xmlns="http://www.w3.org/2000/svg">
                        <g id="Group">
                            <g id="Group_2">
                                <path id="Vector" d="M15.1785 0H1.82142C0.815477 0 0 0.815478 0 1.82142V11.5357C0 12.5416 0.815477 13.3571 1.82142 13.3571H3.97678L3.64651 16.326C3.60969 16.6593 3.85003 16.9593 4.18333 16.9961C4.35544 17.0151 4.52748 16.9597 4.65619 16.8439L8.53094 13.3571H15.1785C16.1845 13.3571 16.9999 12.5416 16.9999 11.5357V1.82142C16.9999 0.815478 16.1845 0 15.1785 0Z" />
                            </g>
                        </g>
                    </svg>

                    <p>CHAT</p>
                </button>
            </div>

            <style jsx>{`
              .bottom-navbar {
                display: none;
              }

              .button {
                display: flex;
                flex-direction: column;
                align-items: center;
                
                position: relative;
                
                outline: unset;
                border: unset;
                background: unset;
                padding: unset;

                gap: 5px;

                color: #ADA3EF;
                font-size: 12px;
                font-weight: 700;
                font-family: "Geogrotesque Wide";

                cursor: pointer;
                transition: color .3s;
              }

              svg {
                transition: fill .3s;
              }

              .button:hover svg {
                fill: #ADA3EF;
              }
              
              .button.active {
                color: white;
              }

              .button.active svg {
                fill: #FCA31E;
              }

              .dropdown {
                position: absolute;
                width: 210px;

                bottom: 75px;
                left: 50%;
                transform: translateX(-50%);

                max-height: 0;
                z-index: 1;
                transition: max-height .3s;
                overflow: hidden;
              }

              .dropdown.active {
                max-height: 645px;
              }

              .dropdown.active .decoration-arrow {
                z-index: 1;
              }
              
              .decoration-arrow {
                width: 13px;
                height: 9px;

                background: #26214A;
                position: absolute;
                left: 50%;
                bottom: 0;
                transform: translateX(-50%);
                z-index: -1;
                
                clip-path: polygon(0% 0%, 50% 100%, 100% 0%);
              }

              .dropdown-container {
                margin-bottom: 8px;
                padding: 9px;

                border: 1px solid #3A336D;
                background: #26214A;
                border-radius: 10px;

                font-family: 'Geogrotesque Wide';
                font-weight: 600;
                font-size: 13px;
                color: #ADA3EF;

                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
              }

              .gamemode {
                width: 100%;
                aspect-ratio: 218 / 98;
                border-radius: 6px;
                height: fit-content;

                display: flex;
                align-items: center;

                position: relative;
                background-size: 100% 100%;
                background-position: center;
                transition: background .3s;
              }

              .gamemode:hover {
                background-size: 110% 110%;
              }

              .gamemode img {
                width: 100%;
              }

              .name {
                width: 100%;
                height: 25px;
                border-radius: 0 0 6px 6px;

                background: rgba(0, 0, 0, 0.32);
                

                display: flex;
                align-items: center;
                justify-content: center;

                left: 0;
                bottom: 0;
                position: absolute;
                color: white;
              }

              @media only screen and (max-width: 1000px) {
                .bottom-navbar {
                  display: flex;
                  position: fixed;
                  bottom: 0;
                  
                  height: 60px;
                  width: 100%;
                  
                  background: #262147;
                  box-shadow: 0px -5px 15px 0px rgba(0, 0, 0, 0.25);
                  
                  align-items: center;
                  justify-content: space-between;
                  padding: 0 25px;
                }
              }

              @media only screen and (max-width: 375px) {
                .dropdown {
                  width: 180px;
                }
              }
            `}</style>
        </>
    );
}

export default BottomNavBar;
