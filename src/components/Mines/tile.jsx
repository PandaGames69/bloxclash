import {createEffect, createSignal} from "solid-js";
import {authedAPI} from "../../util/api";

function Tile(props) {

    const [isProcessing, setIsProcessing] = createSignal(false)
    const [animate, setAnimate] = createSignal(null)
    const [pending, setPending] = createSignal(null)

    let mine = new Audio('/assets/sfx/mine.mp3')
    let tile0 = new Audio('/assets/sfx/tile0.mp3')
    let tile1 = new Audio('/assets/sfx/tile1.mp3')
    let tile2 = new Audio('/assets/sfx/tile2.mp3')

    createEffect(() => {
        if ((pending() || animate()) && !props?.game?.active) {
            setAnimate(false)
            setPending(false)
        }

        if (props?.game?.active && props?.random === props?.index && !isProcessing()) {
            clickTile(props?.index)
        }
    })

    async function clickTile(tile) {
        if (!props?.game || !props?.game.active || isProcessing() || props?.revealed.includes(tile)) return
        setIsProcessing(true)
        setAnimate(true)

        let res = await authedAPI('/mines/reveal', 'POST', JSON.stringify({ field: tile }) , true)
        if (!res.success) return setIsProcessing(false)

        setPending(res)
    }

    function handleMineClick(res) {
        try {
            if (res.payout) {
                props?.setRevealed([...props?.revealed, props?.index])
                return props?.cashoutGame(res)
            }

            if (!res.isMine) {
                props?.setRevealed(res.revealedTiles || [])
                props?.setGame({
                    ...props?.game,
                    multiplier: res.multiplier,
                    currentPayout: res.currentPayout,
                    active: true,
                })

                if (props?.revealed.length < 8) {
                    tile0.play()
                } else if (props?.revealed.length < 16) {
                    tile1.play()
                } else {
                    tile2.play()
                }
            } else {
                props?.setGame({
                    ...props?.game,
                    active: false,
                })

                props?.setBombs(res.minePositions || [])
                props?.setRevealed(res.revealedTiles || [])

                mine.play()
            }

            setAnimate(null)
            setPending(null)
            setIsProcessing(false)
        } catch (e) {
            console.error('ERROR WITH MINES ', e)

            return
        }
    }

    function getTileState(tile) {
        let classNames = ''

        if (props?.bombs.includes(tile)) classNames += ' bomb'
        if (props?.revealed.includes(tile)) classNames += ' active'

        if (classNames.includes('active') && !classNames.includes('bomb'))
            return ' gem active'

        if (classNames === '' && props?.game && !props?.game.active)
            return ' gem'

        return classNames
    }

    return (
        <>
            <div
                className={'mine' + getTileState(props?.index) + (animate() ? ' animate' : '')}
                onClick={() => clickTile(props?.index)}
                onAnimationIteration={(e) => {
                    if (!pending()) return
                    handleMineClick(pending())
                }}
            >
                <img src='/assets/icons/minesgem.png' className='popin gem-img' alt=''/>
                <img src='/assets/icons/greensparkles.png' className='popin green-sparkles' alt=''/>

                <img src='/assets/icons/bomb.png' className='popin bomb-img' alt=''/>
                <img src='/assets/icons/purplesparkles.png' className='popin purple-sparkles' alt=''/>
            </div>

            <style jsx>{`
              .mine {
                aspect-ratio: 1;
                width: 100%;
                background: #3A3466;
                
                border-top: 4px solid #463F7B;
                border-left: 4px solid #463F7B;
                border-right: 4px solid #2D2852;
                border-bottom: 4px solid #2D2852;
                
                transition: background .3s, border .3s;
                cursor: pointer;
                
                display: flex;
                align-items: center;
                justify-content: center;
                
                position: relative;
              }
              
              .mine:hover {
                background: #463F7B;
              }
              
              .mine.animate {
                animation: infinite pulse .5s;
              }
              
              .mine.gem:not(.active), .mine.bomb:not(.active) {
                opacity: 0.5;
              }
              
              .mine.gem {
                border-radius: 5px;
                border: 1px solid #59E878;
                background: radial-gradient(139.03% 139.03% at 50% 50%, rgba(0, 255, 26, 0.45) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(0deg, rgba(11, 12, 11, 0.25) 0%, rgba(11, 12, 11, 0.25) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);
                box-shadow: 0px 2px 7px 0px rgba(0, 0, 0, 0.15) inset, 0px 0px 31px 0px rgba(10, 182, 47, 0.56) inset;
              }

              .mine.bomb {
                border-radius: 5px;
                border: 1px solid rgba(126, 42, 137, 0.25);
                background: linear-gradient(180deg, rgba(173, 4, 221, 0.15) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(0deg, rgba(18, 16, 36, 0.67) 0%, rgba(18, 16, 36, 0.67) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);
                box-shadow: 0px 2px 7px 0px rgba(0, 0, 0, 0.15) inset, 0px 0px 31px 0px rgba(66, 36, 207, 0.25) inset;
              }
              
              .popin {
                opacity: 0;
                transform: scale(0.7);
                transition: opacity .3s, transform .3s;

                position: absolute;
              }
              
              .gem-img {
                height: 100%;
              }

              .bomb-img {
                height: 75%;
              }
              
              .purple-sparkles {
                height: 100%;
              }
              
              .green-sparkles {
                width: 90%;
              }
              
              .gem .gem-img.popin, .gem .green-sparkles.popin, .bomb .bomb-img, .bomb .purple-sparkles.popin {
                opacity: 1;
                transform: scale(1);
              }

              @keyframes pulse {
                0% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.05);
                }
                100% {
                  transform: scale(1);
                }
              }
            `}</style>
        </>
    );
}

export default Tile;
