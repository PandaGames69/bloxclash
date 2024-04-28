import {createEffect, createSignal, For} from "solid-js";
import LiveDrop from "./livedrop";
import {useWebsocket} from "../../contexts/socketprovider";
import LiveDot from "./livedot";

function LiveDrops(props) {

    let hasConnected = false
    const [ws] = useWebsocket()
    const [open, setOpen] = createSignal(true)
    const [option, setOption] = createSignal('live')

    const [top, setTop] = createSignal([])
    const [live, setLive] = createSignal([])

    createEffect(() => {
        if (ws() && ws().connected && !hasConnected) {
            ws().emit('cases:subscribe')
            ws().on('cases:drops:all', (drops) => {
                setLive(drops.slice(0,20))
            })
            ws().on('cases:drops:top', (drops) => {
                setTop(drops.slice(0,20))
            })
            ws().on('cases:drops', (drop) => {
                let newLive = [...drop, ...live()].slice(0, 20)
                setLive(newLive)

                if (drop.top) {
                    let newTop = [...drop, ...top()].slice(0, 20)
                    setTop(newTop)
                }
            })
        }

        hasConnected = !!ws()?.connected
    })

    return (
        <>
            <div class='case-drops-container'>
                <div class='drops-header'>
                    <div class='options'>
                        <button class={'bevel-light option ' + (option() === 'live' ? 'active' : '')} onClick={() => setOption('live')}>
                            <LiveDot type='green'/>
                            LIVE DROPS
                        </button>

                        <button class={'bevel-light option ' + (option() === 'top' ? 'active' : '')} onClick={() => setOption('top')}>
                            <LiveDot type='gold'/>
                            TOP DROPS
                        </button>
                    </div>

                    <div class='bar'/>

                    <svg class={'arrow ' + (!open() ? 'active' : '')} xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6" fill="none" onClick={() => setOpen(!open())}>
                        <path d="M4.99998 6C4.82076 6 4.64157 5.92807 4.50493 5.78451L0.205142 1.26463C-0.0683806 0.977107 -0.0683806 0.510942 0.205142 0.223538C0.478554 -0.0638665 0.714286 0.00798196 1.19548 0.00798455H4.99998L8.57143 0.00798564C9.28572 0.00798564 9.52137 -0.0637267 9.79476 0.223677C10.0684 0.511081 10.0684 0.977246 9.79476 1.26477L5.49504 5.78465C5.35834 5.92823 5.17914 6 4.99998 6Z" fill="#9489DB"/>
                    </svg>
                </div>

                <div class={'drops-container ' + (open() ? 'active' : '')}>
                    <For each={option() === 'live' ? live() : top()}>{(drop, index) => <LiveDrop {...drop}/>}</For>
                </div>
            </div>

            <style jsx>{`
                .case-drops-container {
                    width: 100%;
                    position: relative;
                    margin-bottom: 20px;
                }

                .drops-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .options {
                    display: flex;
                    gap: 8px;
                }

                .option {
                    width: 100px;
                    height: 30px;
                    font-weight: 600;
                    font-size: 12px;
                    display: flex;

                    gap: 5px;
                    align-items: center;
                    justify-content: center;
                }

                .option.active {
                    box-shadow: unset;
                    border: 1px solid #575298;
                    background: #2D2A52;
                    color: white;
                }

                .bar {
                    flex: 1;
                    height: 1px;

                    background: #5A5499;
                }

                .arrow {
                    cursor: pointer;
                }

                .arrow.active {
                    transform: rotate(180deg);
                }

                .drops-container {
                    max-height: 0;
                    overflow: hidden;
                    display: flex;
                    transition: max-height .3s;
                    gap: 10px;
                    overflow-x: scroll;
                    margin-top: 20px;
                    scrollbar-color: transparent transparent;
                }

                .drops-container::-webkit-scrollbar {
                    display: none;
                }

                .drops-container.active {
                    max-height: 140px;
                }
            `}</style>
        </>
    );
}

export default LiveDrops;
