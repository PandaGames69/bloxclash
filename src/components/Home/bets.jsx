import {createEffect, createResource, createSignal, For} from "solid-js";
import {api} from "../../util/api";
import {useWebsocket} from "../../contexts/socketprovider";
import Avatar from "../Level/avatar";
import {getCents} from "../../util/balance";

const tempBets = [0,0,0,0,0,0,0,0]

const gameToImage = {
    'case': '/assets/icons/cases.svg',
    'battle': '/assets/icons/battles.svg',
    'roulette': '/assets/icons/roulette.svg',
    'crash': '/assets/icons/crash.svg',
    'coinflip': '/assets/icons/coinflip.svg',
    'jackpot': '/assets/icons/jackpot.svg',
    'slot': '/assets/icons/slot.svg',
    'mines': '/assets/icons/mines.svg'
}

function Bets(props) {

    let prevWs
    let hasEmittedMe = false
    const [ws] = useWebsocket()
    const [option, setOption] = createSignal('user')
    const [bets, setBets] = createSignal([])

    createEffect(() => {
        if (ws()?.connected && !prevWs?.connected) {
            ws().emit('bets:subscribe', 'all')
        }

        if (ws()) {
            ws().on('bets', (type, bets) => {
                if (type !== option()) {
                    ws().emit('bets:unsubscribe', option())
                    setBets([])
                }

                setOption(type)
                setBets((b) => [...bets, ...b].slice(0, 10))
            })
        }

        prevWs = ws()
    })

    createEffect(() => {
        if (!hasEmittedMe && props.user && ws()) {
            ws().emit('bets:subscribe', 'me')
            hasEmittedMe = true
        }
    })

    function changeBetChannel(channel) {
        ws().emit('bets:subscribe', channel)
    }

    return (
        <>
            <div class='bets-container'>
                <div class='bets-options'>
                    {props?.user && (
                        <button class={'option ' + (option() === 'me' ? 'active' : '')} onClick={() => changeBetChannel('me')}>MY BETS</button>
                    )}

                    <button class={'option ' + (option() === 'all' ? 'active' : '')} onClick={() => changeBetChannel('all')}>ALL BETS</button>
                    <button class={'option ' + (option() === 'high' ? 'active' : '')} onClick={() => changeBetChannel('high')}>HIGH BETS</button>
                    <button class={'option ' + (option() === 'lucky' ? 'active' : '')} onClick={() => changeBetChannel('lucky')}>LUCKY WINS</button>
                </div>

                <table class='bets-table' cellSpacing={0}>
                    <thead class='bets-header'>
                        <tr>
                            <th>GAME</th>
                            <th>USER</th>
                            <th class='large'>TIME</th>
                            <th class='large'>WAGER AMOUNT</th>
                            <th class='large'>MULTIPLIER</th>
                            <th>PAYOUT</th>
                        </tr>
                    </thead>

                    <tbody>
                        <For each={bets()}>{(bet, index) => (
                            <tr class='bet'>
                                <td>
                                    <div class='image-data white caps'>
                                        <img src={gameToImage[bet.game]} alt='' height='17'/>
                                        {bet.game}
                                    </div>
                                </td>

                                <td>
                                    <div class='image-data user'>
                                        <Avatar id={bet?.user?.id} xp={bet?.user?.xp || 0} height={30}/>
                                        {bet?.user?.username || 'Anonymous'}
                                    </div>
                                </td>

                                <td class='large'>{new Date(bet?.createdAt).toLocaleTimeString()}</td>

                                <td class='large'>
                                    <div class='image-data white'>
                                        <img src='/assets/icons/coin.svg' alt='' height='17'/>
                                        <p>{Math.floor(bet?.amount || 0)}<span class='cents'>.{getCents(bet?.amount || 0)}</span></p>
                                    </div>
                                </td>

                                <td class={'large ' + ((bet?.payout / bet?.amount) > 1 ? 'green' : '')}>
                                    {(bet?.payout / bet?.amount).toFixed(2)}x
                                </td>

                                <td>
                                    <div class={'image-data ' + ((bet?.payout / bet?.amount) > 1 ? 'gold' : 'lum')}>
                                        <img src='/assets/icons/coin.svg' alt='' height='17'/>
                                        {(bet?.payout / bet?.amount > 1) ? '+' : ''} <p>{Math.floor(bet?.payout || 0)}<span class='cents'>.{getCents(bet?.payout || 0)}</span></p>
                                    </div>
                                </td>
                            </tr>
                        )}</For>
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .bets-container {
                  
                }
              
                .bets-options {
                  width: 100%;
                  display: flex;
                  gap: 10px;
                  justify-content: center;
                }
                
                .option {
                  width: 147px;
                  height: 37px;
                  border-radius: 3px 3px 0 0;
                  background: #403674;

                  color: #9789CF;
                  font-size: 14px;
                  font-family: Geogrotesque Wide;
                  font-weight: 600;
                  
                  outline: unset;
                  border: unset;
                  position: relative;
                  cursor: pointer;
                  
                  transition: all .3s;
                }
                
                .option:before {
                  width: calc(100% + 2px);
                  height: calc(100% + 2px);

                  border-radius: 3px 3px 0 0;
                  position: absolute;
                  content: '';
                  z-index: -1;
                  
                  top: -1px;
                  left: -1px;
                  background: linear-gradient(to top, #4E3D76, #2A2352, #2A2352, #2A2352, #4E3D76, #E78EF5, #E78EF5);

                  opacity: 0;
                  
                  transition: opacity .3s;
                }
                
                .option.active:before {
                  opacity: 1;
                }
                
                .option.active {
                  color: #E78EF5;
                  text-shadow: rgba(231, 142, 245, 0.5) 0px 0px 25px, rgba(0, 0, 0, 0.25) 0px 2px 0px;
                }

                .bets-table {
                  width: 100%;
                  border-radius: 3px;
                  overflow: hidden;
                }
                
                .bets-header {
                  width: 100%;
                  height: 40px;
                  background: #2A2352;

                  color: #9789CF;
                  font-size: 13px;
                  font-family: Geogrotesque Wide;
                  font-weight: 700;
                  
                  text-align: left;
                }
                
                .bet {
                  background: unset;
                  height: 45px;

                  color: #ADA3EF;
                  font-size: 13px;
                  font-family: Geogrotesque Wide;
                  font-weight: 600;
                }
                
                .bet:nth-child(2n - 1) {
                  background: rgba(160, 115, 255, 0.10);
                }
                
                .image-data {
                  display: flex;
                  align-items: center;
                  gap: 5px;
                }
                
                .lum {
                  mix-blend-mode: luminosity;
                  color: #9693C0;

                }
                
                .caps {
                  text-transform: uppercase;
                }
                
                .user {
                  gap: 10px;
                }
                
                td:first-child, th:first-child {
                  padding: 0 0 0 30px;
                }
                
                .cents {
                  color: #A7A7A7;
                }
                
                .gold .cents {
                  color: #9A6C26;
                }

                @media only screen and (max-width: 850px) {
                  .large {
                    display: none;
                  }
                }
            `}</style>
        </>
    );
}

export default Bets;
