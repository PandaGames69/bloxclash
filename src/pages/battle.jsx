import {A, useParams, useSearchParams} from "@solidjs/router";
import BattleHeader from "../components/Battles/battleheader";
import GreenCount from "../components/Count/greencount";
import {createEffect, createResource, createSignal, For, onCleanup} from "solid-js";
import {useWebsocket} from "../contexts/socketprovider";
import Loader from "../components/Loader/loader";
import BattleColumn from "../components/Battles/battlecolumn";
import {subscribeToGame, unsubscribeFromGames} from "../util/socket";
import {calculateWinnings, convertItems, fillEmptySlots, getRoundWinner, getWonItems} from "../util/battleutil";
import {Title} from "@solidjs/meta";

function Battle(props) {

    let params = useParams()
    const [searchParams, setSearchParams] = useSearchParams()

    let hasConnected = false
    const [ws] = useWebsocket()

    let prevBattle = null
    const [battle, { mutate: setBattle }] = createResource(() => params.id, subscribeToBattle)

    const [players, setPlayers] = createSignal(0)
    const [state, setState] = createSignal('WAITING')
    const [rounds, setRounds] = createSignal([], { equals: false })
    const [round, setRound] = createSignal(0)
    const [block, setBlock] = createSignal('')

    // Winning
    const [winnerTeam, setWinnerTeam] = createSignal(0)
    const [roundWinners, setRoundWinners] = createSignal([])
    const [wonItems, setWonItems] = createSignal([])
    const [won, setWon] = createSignal(0)

    function subscribeToBattle(id) {
        if (ws() && ws().connected) {
            ws().emit('battles:subscribe', id, searchParams?.pk)
        }

        return null
    }

    createEffect(() => {
        if (ws() && ws().connected && !hasConnected) {
            ws().emit('battles:subscribe', params.id, searchParams?.pk)
            ws().on('battle', (b) => {

                if (prevBattle !== b.id) {
                    resetValues()
                    ws().emit('battles:unsubscribe', prevBattle)
                }
                prevBattle = b.id

                if (b.id !== battle()?.id) resetValues()

                let max = b.playersPerTeam * b.teams
                b.players = fillEmptySlots(max, b.players)

                setRound(b.round)
                initRounds(b)

                if (b.round < 1 && b.EOSBlock) {
                    setState('EOS')
                    setBlock(b.EOSBlock)
                }

                if (b.round > 0 && !b.endedAt) {
                    setState('ROLLING')
                    let itemsInRound = wonItems().slice((b.round - 1) * players(), b.round * players())
                    setRoundWinners(getRoundWinner(itemsInRound, b.playersPerTeam))
                }

                if (b.endedAt) {
                    setWinnerTeam(b.winnerTeam - 1)
                    setState('WINNERS')
                }

                setPlayers(max)
                setBattle(b)
            })

            ws().on('battle:join', (id, user) => {
                let curBattle = battle()
                if (id !== curBattle.id) return

                curBattle.players[user.slot - 1] = user
                setBattle({...curBattle})
            })

            ws().on('battle:commit', (id, block) => {
                if (id !== battle().id) return
                setState('EOS')
                setBlock(block)
            })

            ws().on('battle:start', (battleId, rounds, clientSeed, serverSeed) => {
                // if (battleId !== battle()?.id) return ws().emit('battles:unsubscribe', battleId)
                setRounds(rounds)
                setWonItems(getWonItems(rounds, battle()?.cases))
                setWon(calculateWinnings(battle().cases, rounds, battle().playersPerTeam))
            })

            ws().on('battle:round', (battleId, roundNum) => {
                // if (battleId !== battle()?.id) return ws().emit('battles:unsubscribe', battleId)
                setState('ROLLING')
                setRound(roundNum)

                let itemsInRound = wonItems().slice((roundNum - 1) * players(), roundNum * players())
                setRoundWinners(getRoundWinner(itemsInRound, battle().playersPerTeam))
            })

            ws().on('battle:ended', (battleId, { winnerTeam, serverSeed, clientSeed }) => {
                setWinnerTeam(winnerTeam - 1)
                setState('WINNERS')
            })
        }

        hasConnected = !!ws()?.connected
    })

    onCleanup(() => {
        if (ws() && ws().connected) {
            ws().emit('battles:unsubscribe', prevBattle)
            ws().off('battle')
            ws().off('battle:join')
            ws().off('battle:commit')
            ws().off('battle:start')
            ws().off('battle:ended')
            ws().off('battle:start')
        }
    })

    function initRounds(battle) {
        if (!battle || battle.round < 1) return

        setRound(battle.round)
        setRounds([...battle.rounds])
        setWonItems(getWonItems(battle.rounds, battle.cases))
        setWon(calculateWinnings(battle.cases, battle.rounds, battle.playersPerTeam))
    }

    function resetValues() {
        setPlayers([])
        setBattle(null)
        setState('WAITING')
        setBlock(0)
        setWon(0)
        setWonItems([])
        setRounds([])
        setRound(0)
    }

    function getCase(id) {
        if (!battle() || !battle()?.cases) return
        return battle()?.cases?.find(c => id === c.id)
    }

    function isCreator() {
        return props?.user?.id === battle()?.players[0].id
    }

    return (
        <>
            <Title>BloxClash | Battle</Title>

            <div class='battle-container fadein'>
                <BattleHeader battle={battle()} round={round()} state={state()} block={block()}/>

                {!battle() ? (
                    <Loader/>
                ) : (
                    <>
                        <div class='round-info'>
                            <div>
                                <GreenCount number={round()} max={battle()?.rounds?.length} active={round() > 0} css={{width: '90px'}}/>
                            </div>

                            <div class='cases-container'>
                                <div class='cases' style={{'transform': `translateX(-${72 * (round() - 1) + 30}px)`}}>
                                    <For each={battle()?.rounds}>{(c, index) => <img class={'case ' + (round() - 1 === index() ? 'active' : '')}
                                                                                     src={`${import.meta.env.VITE_SERVER_URL}${getCase(c?.caseId)?.img}`}
                                                                                     width='60' height='60' alt=''/>}</For>
                                </div>
                            </div>

                            <div class='provably-container'>
                                <A href='/docs/provably' class='provably' style={{width: '130px'}}>PROVABLY FAIR</A>
                            </div>
                        </div>

                        <div class='columns'>
                            <For each={new Array(players())}>{(column, index) =>
                                <BattleColumn
                                    index={index()}
                                    battle={battle()}
                                    player={battle()?.players[index()]}
                                    players={players()}
                                    team={Math.floor(index() / battle()?.playersPerTeam )}
                                    startOfTeam={index() % battle()?.playersPerTeam === 0}
                                    state={state()}
                                    round={round()}
                                    rounds={rounds()}
                                    winnerTeam={winnerTeam()}
                                    max={players() - 1}
                                    creator={isCreator()}
                                    total={won()}
                                    wonItems={wonItems()}
                                    roundWinners={roundWinners()}
                                />
                            }</For>
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
              .battle-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                display: flex;
                flex-direction: column;
                gap: 35px;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }

              .round-info {
                width: 100%;
                height: 65px;

                border-radius: 5px;
                border: 1px dashed rgba(173, 163, 239, 0.35);
                background: rgba(90, 84, 153, 0.35);

                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 15px;
              }

              .round-info > * {
                flex: 1;
              }

              .provably-container {
                display: flex;
                justify-content: flex-end;
              }

              .cases-container {
                overflow: hidden;
                height: 100%;
                width: 100%;
                max-width: 485px;
                position: relative;
              }
              
              .cases {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                gap: 12px;
                
                position: absolute;
                transform: translateX(-30px);
                left: 50%;
                transition: transform .3s;
              }
              
              .case {
                opacity: 0.5;
                transition: all 0.3s;
                filter: grayscale(1);
              }
              
              .case.active {
                opacity: 1;
                filter: unset;
              }

              .columns {
                width: 100%;
                overflow: hidden;
                
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
              }

              @media only screen and (max-width: 1040px) {
                .columns {
                  flex-direction: column;
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

export default Battle;
