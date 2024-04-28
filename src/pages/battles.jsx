import {getCents} from "../util/balance";
import Toggle from "../components/Toggle/toggle";
import {createEffect, createSignal, For, onCleanup} from "solid-js";
import Switch from "../components/Toggle/switch";
import BattlePreview from "../components/Battles/battlepreview";
import {useWebsocket} from "../contexts/socketprovider";
import Loader from "../components/Loader/loader";
import {A} from "@solidjs/router";
import {useUser} from "../contexts/usercontextprovider";
import {subscribeToGame, unsubscribeFromGames} from "../util/socket";
import {fillEmptySlots} from "../util/battleutil";
import {Meta, Title} from "@solidjs/meta";

function Battles(props) {

    const [toggle, setToggle] = createSignal('ALL')
    const [sortByPrice, setSortByPrice] = createSignal(true)
    const [battles, setBattles] = createSignal(null, { equals: false })
    const [user] = useUser()

    let hasConnected = false
    const [ws] = useWebsocket()

    createEffect(() => {
        if (ws() && ws().connected && !hasConnected) {
            unsubscribeFromGames(ws())
            subscribeToGame(ws(), 'battles')

            ws().on('battles:push', (b) => {
                let curBattles = battles() || []
                b.forEach((battle) => battle.players = fillEmptySlots(battle.playersPerTeam * battle.teams, battle.players))
                setBattles([...b, ...curBattles])
            })

            ws().on('battles:join', (id, user) => {
                let battleIndex = battles()?.findIndex(b => id === b.id)
                if (battleIndex < 0) return

                let curBattle = battles()[battleIndex]
                if (id !== curBattle.id) return

                curBattle.players[user.slot - 1] = user
                setBattles([...battles().slice(0, battleIndex), {...curBattle}, ...battles().slice(battleIndex + 1)])
            })

            ws().on('battles:start', (id, winnerTeam) => {
                let battleIndex = battles()?.findIndex(b => id === b.id)
                if (battleIndex < 0) return

                let curBattle = battles()[battleIndex]
                if (id !== curBattle.id) return

                curBattle.startedAt = Date.now()
                setBattles([...battles().slice(0, battleIndex), {...curBattle}, ...battles().slice(battleIndex + 1)])
            })

            ws().on('battles:ended', (id, winnerTeam) => {
                let battleIndex = battles()?.findIndex(b => id === b.id)
                if (battleIndex < 0) return

                let curBattle = battles()[battleIndex]
                if (id !== curBattle.id) return

                curBattle.endedAt = Date.now()
                curBattle.winnerTeam = +winnerTeam
                setBattles([...battles().slice(0, battleIndex), {...curBattle}, ...battles().slice(battleIndex + 1)])
            })

            hasConnected = true
        }

        hasConnected = !!ws()?.connected
    })

    function getSortedBattles(battles, toggle, sortByPrice) {
        if (!Array.isArray(battles) || battles?.length < 2) return battles

        let baseSort = battles

        if (toggle === 'JOINABLE') baseSort = baseSort.filter((battle) => battle.startedAt === null)
        else if (toggle === 'ENDED') baseSort = baseSort.filter((battle) => battle.winnerTeam !== null)

        if (sortByPrice) { // Sort by price
            baseSort = baseSort.sort((a, b) => {
                if (a.endedAt === null && b.endedAt !== null) {
                    return -1;
                } else if (a.endedAt !== null && b.endedAt === null) {
                    return 1;
                } else {
                    return b.entryPrice - a.entryPrice;
                }
            })
        } else { // Sort by date
            baseSort = baseSort.sort((a, b) => {
                if (a.endedAt === null && b.endedAt !== null) {
                    return -1;
                } else if (a.endedAt !== null && b.endedAt === null) {
                    return 1;
                } else {
                    new Date(b.createdAt) - new Date(a.createdAt)
                }
            })
        }

        return baseSort
    }

    function totalPriceOfBattles() {
        return battles()?.reduce((val, battle) => val + battle?.entryPrice, 0)
    }

    function getJoinable() {
        return battles()?.filter((battle) => battle.startedAt === null)
    }

    function isInBattle(battle) {
        if (!user()) return false
        return battle?.players?.find(player => player?.id === user()?.id)
    }

    return (
        <>
            <Title>BloxClash | Battles</Title>
            <Meta name='title' content='Battles'></Meta>
            <Meta name='description' content='Wager Robux On BloxClash Battles And Win Big Versus Other Roblox Players, Win Limiteds!'></Meta>

            <div class='battles-container fadein'>
                <div class='battles-header'>
                    <div class='header-section'>
                        <p class='title'>
                            <img src='/assets/icons/battles.svg' height='18' alt=''/>
                            BATTLES
                        </p>

                        <div class='cost'>
                            <img src='/assets/icons/coin.svg' height='15'/>
                            <p>
                                {Math.floor(totalPriceOfBattles())?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                                <span class='gray'>
                                    .{getCents(totalPriceOfBattles())}
                                </span>
                            </p>
                        </div>

                        <div class='toggle'>
                            <p>ALL</p>
                            <Toggle active={toggle() === 'ALL'} toggle={() => setToggle('ALL')}/>
                        </div>

                        <div class='toggle'>
                            <p>JOINABLE</p>
                            <Toggle active={toggle() === 'JOINABLE'} toggle={() => setToggle('JOINABLE')}/>
                        </div>

                        <div class='toggle'>
                            <p>ENDED</p>
                            <Toggle active={toggle() === 'ENDED'} toggle={() => setToggle('ENDED')}/>
                        </div>
                    </div>

                    <div class='header-section right'>
                        <div class='sort'>
                            <p class={!sortByPrice() ? 'active' : ''}><span class='trim'>SORT BY</span> DATE</p>
                            <Switch active={sortByPrice()} toggle={() => setSortByPrice(!sortByPrice())}/>
                            <p class={sortByPrice() ? 'active' : ''}><span class='trim'>SORT BY</span> PRICE</p>
                        </div>

                        <p class='stat'>{battles()?.length || 0}  <span class='green'>GAMES</span></p>
                        <p class='stat'>{getJoinable()?.length || 0} <span class='green'>JOINABLE</span></p>

                        <button class='bevel-gold create'>
                            CREATE NEW
                            <A href='/battle/create' class='gamemode-link'></A>
                        </button>
                    </div>
                </div>

                <div class='bar'/>

                {battles() ? (
                    <div class='battles'>
                        <For each={getSortedBattles(battles(), toggle(), sortByPrice()) || []}>{(battle, index) => <BattlePreview
                            battle={battle} hasJoined={isInBattle(battle)} ws={ws()}/>}</For>
                    </div>
                ) : (
                    <Loader/>
                )}
            </div>

            <style jsx>{`
              .battles-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }
              
              .battles-header {
                display: flex;
                justify-content: space-between;
              }
              
              .header-section {
                display: flex;
                align-items: center;
                flex-grow: 1;
                gap: 15px;
              }
              
              .right {
                justify-content: flex-end;
              }
              
              .title {
                color: #FFF;
                font-size: 18px;
                font-weight: 700;
                
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .cost {
                height: 30px;
                padding: 0 10px;
                min-width: 100px;
                gap: 6px;
              }
              
              .cost p {
                margin-top: -2px;
              }
              
              .toggle {
                display: flex;
                align-items: center;
                gap: 6px;
                
                color: #ADA3EF;
                font-size: 12px;
                font-weight: 700;
              }
              
              .stat {
                height: 31px;
                line-height: 31px;
                
                color: #FFF;
                font-size: 13px;
                font-weight: 600;
                
                padding: 0 15px;
                border-radius: 3px;
                background: rgba(89, 232, 120, 0.24);
              }
              
              .create {
                width: 130px;
                height: 35px;
                
                position: relative;
                
                font-size: 14px;
              }
              
              .sort {
                display: flex;
                align-items: center;
                gap: 8px;

                color: #ADA3EF;
                font-size: 12px;
                font-weight: 700;
              }
              
              .sort p {
                transition: color .3s;
              }
              
              .sort p.active {
                color: white;
              }
              
              .bar {
                flex: 1;
                height: 1px;
                background: #5A5499;
                margin: 25px 0;
              }
              
              .battles {
                display: flex;
                flex-direction: column;
                width: 100%;
                gap: 30px;
              }

              @media only screen and (max-width: 1420px) {
                .toggle {
                  display: none;
                }
              }

              @media only screen and (max-width: 1180px) {
                .stat {
                  display: none;
                }
              }

              @media only screen and (max-width: 700px) {
                .trim {
                  display: none;
                }
              }

              @media only screen and (max-width: 540px) {
                .battles-header {
                  justify-content: center;
                  flex-direction: column;
                  align-items: center;
                  gap: 25px;
                }
                
                .right {
                  justify-content: center;
                }
              }
              
              @media only screen and (max-width: 1000px) {
                .battles-container {
                  padding-bottom: 90px;
                }
              }
            `}</style>
        </>
    );
}

export default Battles;
