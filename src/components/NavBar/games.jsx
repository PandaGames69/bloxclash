import {createSignal, For} from "solid-js";
import {addDropdown, createNotification} from "../../util/api";
import {A} from "@solidjs/router";

function Games() {

    const [active, setActive] = createSignal(false)
    addDropdown(setActive)

    return (
        <>
            <div class='games-container' onClick={(e) => e.stopPropagation()}>
                <div class={'bevel games ' + (active() ? 'active' : '')} onClick={() => setActive(!active())}>
                    <svg class='cube' width="19" height="22" viewBox="0 0 19 22" fill="#B09BEC"
                         xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M0 6.7481V10.7158L3.62116 12.8067V8.6235L0.013838 6.5412C0.00470492 6.60928 0 6.67839 0 6.7481Z"/>
                        <path d="M4.80713 13.4916L8.43192 15.5845V11.4006L4.80713 9.30817V13.4916Z"/>
                        <path d="M9.02488 6.18939L5.40063 8.28126L9.02488 10.3734L12.6491 8.28126L9.02488 6.18939Z"/>
                        <path d="M9.61792 15.5845L13.2427 13.4916V9.30817L9.61792 11.4006V15.5845Z"/>
                        <path
                            d="M18.036 6.5412L14.4287 8.6235V12.8067L18.0499 10.7158V6.7481C18.0499 6.67839 18.0452 6.60928 18.036 6.5412Z"/>
                        <path
                            d="M17.2701 5.39649C16.4397 4.91667 15.1589 4.17685 13.8357 3.41272L10.2114 5.50462L13.8356 7.59649L17.4443 5.5134C17.3893 5.47086 17.3312 5.43168 17.2701 5.39649Z"/>
                        <path
                            d="M12.6493 2.72784C11.5729 2.1064 10.5499 1.51596 9.80559 1.0867C9.56485 0.947928 9.29485 0.87854 9.02485 0.87854C8.75481 0.87854 8.48477 0.947928 8.24391 1.08678C7.516 1.50742 6.49013 2.09968 5.40112 2.72828L9.02481 4.81987L12.6493 2.72784Z"/>
                        <path
                            d="M4.21534 3.41302C2.91307 4.16474 1.64005 4.89962 0.780915 5.39608C0.719593 5.43143 0.661355 5.47073 0.606201 5.51343L4.21478 7.59648L7.83899 5.50461L4.21534 3.41302Z"/>
                        <path
                            d="M0 15.3681C0 15.9246 0.298939 16.4424 0.780105 16.7198L0.780698 16.7202C1.50846 17.1407 2.53322 17.7323 3.62116 18.3603V14.1763L0 12.0854V15.3681Z"/>
                        <path
                            d="M4.80713 19.045C6.11047 19.7973 7.38482 20.533 8.24464 21.0298C8.30536 21.0648 8.36795 21.0953 8.43192 21.1215V16.9542L4.80713 14.8611V19.045Z"/>
                        <path
                            d="M9.61792 21.1214C9.68209 21.0952 9.74487 21.0646 9.80576 21.0295C10.6859 20.5219 11.9557 19.7889 13.2427 19.0458V14.8611L9.61792 16.9542V21.1214Z"/>
                        <path
                            d="M14.4287 18.3609C15.5338 17.7227 16.5641 17.1276 17.2692 16.7201C17.751 16.4424 18.0499 15.9245 18.0499 15.3681V12.0853L14.4288 14.1762V18.3609H14.4287Z"/>
                    </svg>

                    GAMES

                    <svg class='arrow' width="7" height="5" viewBox="0 0 7 5" fill="none"
                         xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M3.50001 0.994671C3.62547 0.994671 3.7509 1.04269 3.84655 1.13852L6.8564 4.15579C7.04787 4.34773 7.04787 4.65892 6.8564 4.85078C6.66501 5.04263 6.5 4.99467 6.16316 4.99467L3.50001 4.99467L1 4.99467C0.5 4.99467 0.335042 5.04254 0.14367 4.85068C-0.0478893 4.65883 -0.0478893 4.34764 0.14367 4.1557L3.15347 1.13843C3.24916 1.04258 3.3746 0.994671 3.50001 0.994671Z"
                            fill="#9489DB"/>
                    </svg>
                </div>

                <div class={'dropdown ' + (active() ? 'active' : '')}>
                    <div class='decoration-arrow'/>
                    <div class='dropdown-container'>
                        <div className='gamemode'
                             style={{'background-image': 'url("/assets/gamemodes/battles.png")'}}>
                            <A href='/battles' class='gamemode-link' onClick={() => setActive(false)}>
                                <p className='name'>CASE BATTLES</p>
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

                        <div className='gamemode'
                             style={{'background-image': 'url("/assets/gamemodes/coinflip.png")'}}>
                            <A href='/coinflip' class='gamemode-link' onClick={() => setActive(false)}>
                                <p className='name'>COINFLIP</p>
                            </A>
                        </div>

                        <div className='gamemode'
                             style={{'background-image': 'url("/assets/gamemodes/roulette.png")'}}>
                            <A href='/roulette' class='gamemode-link' onClick={() => setActive(false)}>
                                <p className='name'>ROULETTE</p>
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
                    </div>
                </div>
            </div>

            <style jsx>{`
              .games-container {
                position: relative;
                z-index: 2;
                flex: 1;
              }

              .games {
                display: flex;
                align-items: center;
                justify-content: space-around;
                width: 143px;
                padding: 0 15px;
                box-sizing: border-box;
                gap: 10px;

                height: 43px;

                font-weight: 700;
                font-size: 14px;
                color: #ADA3EF;

                cursor: pointer;
                user-select: none;
                transition: color .3s;
              }

              .games.active {
                color: white;
              }

              .cube {
                transition: fill .3s;
              }

              .games.active .cube {
                fill: #FCA31E;
              }

              .games.active .arrow {
                transform: rotate(180deg);
              }

              .dropdown {
                position: absolute;
                width: 236px;

                top: 75px;
                left: 50%;
                transform: translateX(-50%);

                max-height: 0;
                z-index: 1;
                transition: max-height .3s;
                overflow: hidden;
              }

              .dropdown.active {
                max-height: 750px;
              }

              .decoration-arrow {
                width: 13px;
                height: 9px;

                background: #26214A;
                position: absolute;
                left: 50%;
                transform: translateX(-50%);

                clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
              }

              .dropdown-container {
                margin-top: 8px;
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
            `}</style>
        </>
    );
}

export default Games;
