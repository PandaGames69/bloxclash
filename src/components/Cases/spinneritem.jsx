import BezierEasing from 'bezier-easing';
import {createEffect} from "solid-js";
import {findTimeForOffset} from "../../util/cases";

function SpinnerItem(props) {

    let item
    let image
    let scaleAnim
    let opacityAnim
    let swords

    let start
    function playSound(timeStamp, delay, index) {
        if (!start) { start = timeStamp }
        let elapsed = timeStamp - start

        if (elapsed > delay) {
            start = null
            let tick = new Audio('/assets/sfx/casetick.wav')
            tick.play()
            return
        }
        window.requestAnimationFrame((ts) => playSound(ts, delay, index))
    }

    createEffect(() => {
        if (props?.spinning === 'spinning') {
            animate()
        }
    })

    function animate() {
        const lastIndex = 50
        const startIndex = 5

        if (props?.index < startIndex || props?.index > lastIndex) return

        const width = 130
        const firstItem = startIndex * width
        const lastItem = (lastIndex - startIndex + 1) * width // 46 because we start at 5, 51 - 5 is 46

        let indexPx = props?.index * width
        let firstItemEnd = firstItem - width

        let startOffset = Math.min(1, (indexPx - firstItem) / (lastItem + props?.offset))
        let endOffset = props?.index === lastIndex ? 1 : Math.min(1, (indexPx - firstItemEnd) / (lastItem + props?.offset))
        let midPoint = startOffset + (endOffset - startOffset)
        let endScale = props.index === lastIndex ? 1.2 : 1

        if (scaleAnim) scaleAnim.cancel()
        if (opacityAnim) opacityAnim.cancel()

        let config = {
            duration: props?.spinTime || 7000,
            easing: 'cubic-bezier(.05,.85,.3,1)',
            fill: 'forwards',
        }

        if (props?.position === 0) {
            let delay = findTimeForOffset(startOffset, ...[0.05, 0.85, 0.3, 1]) * config.duration
            requestAnimationFrame((ts) => playSound(ts, delay, props?.index))
        }

        scaleAnim = image.animate(
            {
                transform: ['scale(1)', 'scale(1)', 'scale(1.2)', `scale(${endScale})`],
                offset: [0, startOffset, midPoint, endOffset]
            },
            config
        )

        // Basically making it so the opacity is instant compared to the scale effect
        opacityAnim = item.animate(
            {
                opacity: [0.3, 0.3, 1, 1, 1, endScale > 1 ? 1 : 0.3],
                offset: [0, Math.max(0, startOffset - 0.001), startOffset, midPoint, endOffset, Math.min(endOffset + 0.001, 1)]
            },
            config
        )

        swords.animate(
            {
                opacity: [0.3, 0.3, 0.55, 0.55, 0.55, endScale > 1 ? 0.55 : 0.3],
                offset: [0, Math.max(0, startOffset - 0.001), startOffset, midPoint, endOffset, Math.min(endOffset + 0.001, 1)]
            },
            config
        )
    }

    function backImage(price) {
        if (price >= 250000) {
            return '/assets/icons/fancygoldsword.png' // Gold
        } else if (price >= 50000) {
            return '/assets/icons/fancyredsword.png' // Red
        } else if (price >= 10000) {
            return '/assets/icons/fancypurplesword.png' // Pink
        } else if (price >= 1000) {
            return '/assets/icons/fancybluesword.png'
        }
        return '/assets/icons/fancygraysword.png' // Gray
    }

    return (
        <>
            <div class='case-item-container' ref={item}>
                <img ref={image} class='item-image' src={`${import.meta.env.VITE_SERVER_URL}${props.img}`} height='90' alt='' draggable={false}/>
                <img className='back-img' src={backImage(props?.price)} height='70' alt='' ref={swords}/>
            </div>

            <style jsx>{`
              .case-item-container {
                height: 100%;
                
                min-width: 130px;
                width: 130px;
                
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                
                opacity: 0.3;
              }
              
              .item-image {
                position: relative;
                user-select: none;
                z-index: 1 !important;
              }

              .back-img {
                position: absolute;
                z-index: -1;
                opacity: 0.3;
              }
            `}</style>
        </>
    );
}

export default SpinnerItem;
