import {createSignal, For} from "solid-js";
import {A} from "@solidjs/router";
import GameTag from "./gametag";
import GameInfo from "./gameinfo";
import games from "../NavBar/games";

function GamesList() {

    const gamemodes = [
        {
            tag: 'hot',
            icon: '/assets/icons/battles.svg',
            title: 'CASE BATTLES',
            type: 'PVP',
            image: '/assets/gamemodes/battles.png',
            link: '/battles',
        },
        {
            tag: 'new',
            icon: '/assets/icons/slot.svg',
            title: 'SLOTS',
            type: 'PROVIDER',
            image: '/assets/gamemodes/slots.png',
            link: '/slots',
        },
        {
            tag: 'new',
            icon: '/assets/icons/mines.svg',
            title: 'MINES',
            type: 'HOUSE',
            image: '/assets/gamemodes/mines.png',
            link: '/mines',
        },
        {
            icon: '/assets/icons/roulette.svg',
            title: 'ROULETTE',
            type: 'HOUSE',
            image: '/assets/gamemodes/roulette.png',
            link: '/roulette',
        },
        {
            icon: '/assets/icons/coinflip.svg',
            title: 'COINFLIP',
            type: 'PVP',
            image: '/assets/gamemodes/coinflip.png',
            link: '/coinflip',
        },
        {
            icon: '/assets/icons/cases.svg',
            title: 'CASES',
            type: 'PVP',
            image: '/assets/gamemodes/cases.png',
            link: '/cases',
        },
        {
            icon: '/assets/icons/jackpot.svg',
            title: 'JACKPOT',
            type: 'PVP',
            image: '/assets/gamemodes/jackpot.png',
            link: '/jackpot',
        },
    ]

    const [page, setPage] = createSignal(0)

    return (
        <>
            <div class='games'>
                <div class='games-header'>
                    <svg class='cube' width="19" height="22" viewBox="0 0 19 22" fill="#B09BEC"
                         xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M0 6.7481V10.7158L3.62116 12.8067V8.6235L0.013838 6.5412C0.00470492 6.60928 0 6.67839 0 6.7481Z"/>
                        <path d="M4.80713 13.4916L8.43192 15.5845V11.4006L4.80713 9.30817V13.4916Z"/>
                        <path
                            d="M9.02488 6.18939L5.40063 8.28126L9.02488 10.3734L12.6491 8.28126L9.02488 6.18939Z"/>
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

                    <p>
                        <span class='house-text'>ALL</span> <span class='games-text'>GAMES</span>
                    </p>

                    <div class='line'/>

                    <button className='bevel-purple arrow' onClick={() => setPage(Math.max(page() - 1, 0))}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M12 6L2 6M2 6L7.6 0.999999M2 6L7.6 11" stroke="white" stroke-width="2"/>
                        </svg>
                    </button>

                    <button className='bevel-purple arrow' onClick={() => setPage(Math.min(page() + 1, Math.floor(gamemodes.length / 6)))}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M1.58933e-07 6L10 6M10 6L4.4 11M10 6L4.4 0.999999" stroke="white"
                                  stroke-width="2"/>
                        </svg>
                    </button>
                </div>

                <div class='dropdown-games'>
                    <For each={gamemodes.slice(page() * 6, (page() + 1) * 6)}>{(game) =>
                        <div className='gamemode'>
                            <div className='info'>
                                {game.tag && (
                                    <GameTag tag={game.tag}/>
                                )}
                                <img src={game.icon} alt='' height='16'/>
                                <p>{game.title}</p>
                                <GameInfo type={game.type}/>
                            </div>
                            <A href={game.link} class='gamemode-link'/>
                            <div className='gamemode-image'
                                 style={{'background-image': `url(${game?.image})`}}/>
                        </div>
                    }</For>
                </div>
            </div>

            <style jsx>{`
              .games {
                width: 100%;
                margin-top: 30px;
              }

              .games-header {
                outline: unset;
                border: unset;

                width: 100%;
                height: 45px;

                border-radius: 5px;
                background: linear-gradient(90deg, rgb(104, 100, 164) -49.01%, rgba(90, 84, 149, 0.655) -5.08%, rgba(66, 53, 121, 0) 98.28%);

                padding: 0 15px;
                display: flex;
                align-items: center;
                gap: 12px;
              }

              .games-header p {
                color: #ADA3EF;
                font-size: 22px;
                font-weight: 800;
                user-select: none;
              }

              .cube, .house-text, .games-text {
                transition: all .3s;
              }

              .games-text {
                color: #ADA3EF;
              }

              .games .cube {
                fill: #FCA31E;
              }

              .games .house-text {
                color: white;
              }

              .games .games-text {
                color: #FCA31E;
              }

              .line {
                flex: 1;
                height: 1px;

                border-radius: 2525px;
                background: linear-gradient(90deg, #5A5499 0%, rgba(90, 84, 153, 0.00) 100%);
              }

              .dropdown-games {
                display: none;
              }

              .dropdown-games {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                grid-gap: 15px 20px;

                margin-top: 30px;
              }

              .gamemode {
                width: 100%;
                aspect-ratio: 373/200;
                border-radius: 6px;
                overflow: hidden;

                display: flex;
                flex-direction: column;

                position: relative;
              }

              .info {
                height: 35px;
                width: 100%;

                color: #FFF;
                font-size: 16px;
                font-weight: 800;

                border-radius: 3px 3px 0 0;
                background: #423579;
                border: 1px solid transparent;
                background-clip: padding-box;

                display: flex;
                align-items: center;
                padding: 0 10px;
                gap: 10px;

                position: relative;
              }

              .info:before {
                top: -1px;
                left: -1px;
                content: '';
                height: calc(100% + 2px);
                width: calc(100% + 2px);
                position: absolute;
                background: linear-gradient(to top, #382D68, #6B54CC);
                z-index: -1;
                border-radius: 3px 3px 0 0;
              }

              .gamemode-image {
                width: 100%;
                flex: 1;

                background-size: 100% 100%;
                background-position: center;
                transition: background .3s;
              }

              .gamemode:hover .gamemode-image {
                background-size: 105% 105%;
              }

              .arrow {
                width: 40px;
                height: 30px;

                display: flex;
                align-items: center;
                justify-content: center;

                cursor: pointer;
                margin-left: auto;
              }
            `}</style>
        </>
    );
}

export default GamesList;
