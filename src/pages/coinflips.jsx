import {getCents} from "../util/balance";
import Toggle from "../components/Toggle/toggle";
import {createEffect, createSignal, For, onCleanup} from "solid-js";
import Switch from "../components/Toggle/switch";
import {useWebsocket} from "../contexts/socketprovider";
import Loader from "../components/Loader/loader";
import CoinflipPreview from "../components/Coinflips/coinflippreview";
import CreateCoinflip from "../components/Coinflips/coinflipcreate";
import CoinflipModal from "../components/Coinflips/coinflipmodal";
import {useUser} from "../contexts/usercontextprovider";
import {subscribeToGame, unsubscribeFromGames} from "../util/socket";
import {Meta, Title} from "@solidjs/meta";

const END_DELAY = 11000

function Coinflips(props) {

    const [ws] = useWebsocket()
    const [user] = useUser()

    const [toggle, setToggle] = createSignal('ALL')
    const [sortByPrice, setSortByPrice] = createSignal(true)
    const [flips, setFlips] = createSignal([])
    const [create, setCreate] = createSignal(false)
    const [viewing, setViewing] = createSignal(null)
    const [time, setTime] = createSignal(Date.now())

    let hasConnected = false

    function updateFlip(flip, index) {
        if (viewing()?.id === flip.id) {
            setViewing(flip)
        }

        setFlips([
            ...flips().slice(0, index),
            flip,
            ...flips().slice(index + 1)
        ])
    }

    createEffect(() => {
        if (ws() && ws().connected && !hasConnected) {

            unsubscribeFromGames(ws())
            subscribeToGame(ws(), 'coinflip')

            ws().on('coinflips:push', (flips) => {
                flips.forEach(flip => {
                    if (!flip.startedAt) return
                    flip.endsAt = new Date(flip.startedAt).getTime() + END_DELAY
                })

                setFlips((f) => [...flips, ...f])
            })

            ws().on('coinflip:join', (cfId, side, user) => {
                let index = flips().findIndex(cf => cf.id === cfId)
                if (index < 0) return

                let newFlip = {...flips()[index]}
                newFlip[side] = user

                updateFlip(newFlip, index)
            })

            ws().on('coinflip:commit', (cfId, block) => {
                let index = flips().findIndex(cf => cf.id === cfId)
                if (index < 0) return

                let newFlip = {...flips()[index]}
                newFlip.EOSBlock = block

                updateFlip(newFlip, index)
            })

            ws().on('coinflip:started', (cfId, client, server, side) => {
                let index = flips().findIndex(cf => cf.id === cfId)
                if (index < 0) return

                let newFlip = {...flips()[index]}
                newFlip.winnerSide = side
                newFlip.serverSeed = server
                newFlip.clientSeed = client
                newFlip.startedAt = Date.now()
                newFlip.endsAt = Date.now() + END_DELAY

                updateFlip(newFlip, index)
            })

            hasConnected = true
        }

        hasConnected = !!ws()?.connected
    })

    function getSortedFlips(flips, toggle, sortByPrice) {
        if (!Array.isArray(flips) || flips?.length < 2) return flips

        let flipsSort = flips

        if (toggle === 'JOINABLE') flipsSort = flipsSort.filter((battle) => battle?.startedAt === null)
        else if (toggle === 'ENDED') flipsSort = flipsSort.filter((battle) => battle?.winnerTeam !== null)

        if (sortByPrice) flipsSort = flipsSort.sort((a,b) => b.amount - a.amount)
        else flipsSort = flipsSort.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))

        return flipsSort
    }

    function totalPriceOfFlips() {
        return flips()?.reduce((val, flip) => val + flip?.amount, 0)
    }

    function getJoinable() {
        return flips()?.filter((flip) => flip.startedAt === null)
    }

    let timer = setInterval(() => setTime(Date.now()), 1000)
    onCleanup(() => clearInterval(timer))

    return (
        <>
            <Title>BloxClash | Coinflips</Title>
            <Meta name='title' content='Coinflip'></Meta>
            <Meta name='description' content='Flip Limiteds And Robux For Free On BloxClash, Make Free Robux And Win Conflips!'></Meta>

            {create() && (
                <CreateCoinflip close={() => setCreate(false)} setViewing={setViewing}/>
            )}

            {viewing() && (
                <CoinflipModal time={time()} cf={viewing()} close={() => setViewing(null)} user={user()}/>
            )}

            <div class='coinflips-container fadein'>
                <div class='coinflips-header'>
                    <div class='header-section'>
                        <p class='title'>
                            <img src='/assets/icons/coin2.svg' height='18' alt=''/>
                            COINFLIP
                        </p>

                        <div class='cost'>
                            <img src='/assets/icons/coin.svg' height='15'/>
                            <p>
                                {Math.floor(totalPriceOfFlips())?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                                <span class='gray'>
                                    .{getCents(totalPriceOfFlips())}
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

                        <p class='stat'>{flips()?.length || 0}  <span class='green'>GAMES</span></p>
                        <p class='stat'>{getJoinable()?.length || 0} <span class='green'>JOINABLE</span></p>

                        <button class='bevel-gold create' onClick={() => setCreate(true)}>
                            CREATE NEW
                        </button>
                    </div>
                </div>

                <div class='bar'/>

                {flips() ? (
                    <div class='coinflips'>
                        <For each={getSortedFlips(flips(), toggle(), sortByPrice())}>{(cf, index) => <CoinflipPreview time={time()} user={user()} click={() => setViewing(cf)} flip={cf}/>}</For>
                    </div>
                ) : (
                    <Loader/>
                )}
            </div>

            <style jsx>{`
              .coinflips-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }
              
              .coinflips-header {
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
              
              .coinflips {
                display: flex;
                flex-direction: column;
                width: 100%;
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
                .coinflips-header {
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
                .coinflips-container {
                  padding-bottom: 90px;
                }
              }
            `}</style>
        </>
    );
}

export default Coinflips;
