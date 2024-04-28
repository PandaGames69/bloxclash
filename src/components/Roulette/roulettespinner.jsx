import {createEffect, createSignal, For} from "solid-js";
import RouletteIcon from "./rouletteicons";
import RouletteNumbers from "./roulettenumbers";
import {useWebsocket} from "../../contexts/socketprovider";

const NUMBERS = [1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8]

function RouletteSpinner(props) {

    let animations = []
    let icons
    let numbers
    let prev = 0

    createEffect(() => {
        if (typeof props.roll?.result === 'number') {
            rollSpinner(props.roll?.result)
        }
    })

    function rollSpinner(number) {
        let startOffset = numberToOffset(prev) + 1275
        let resetOffset = numberToOffset(number) + 1275
        let offset = resetOffset + 5100
        let randomOffset = getRandomNumber(-35, 35)

        prev = number

        animations[0]?.cancel()
        animations[1]?.cancel()

        let slide = [
            {transform: `translateX(-${startOffset}px)`, offset: 0, easing: 'cubic-bezier(.14,.15,0,1)'},
            {transform: `translateX(-${offset + randomOffset}px)`, offset: 0.9, easing: 'cubic-bezier(.14,.15,0,1)'},
            {transform: `translateX(-${offset + randomOffset}px)`, offset: 0.95, easing: 'cubic-bezier(.14,.15,0,1)'},
            {transform: `translateX(-${offset}px)`, offset: 1, easing: 'cubic-bezier(.14,.15,0,1)'},
            {transform: `translateX(-${resetOffset}px)`, offset: 1, easing: 'cubic-bezier(.14,.15,0,1)'},
        ]

        animations[0] = icons.animate(slide, {
            iterations: 1,
            duration: props.config?.rollTime,
            fill: 'forwards'
        })

        animations[1] = numbers.animate(slide, {
            iterations: 1,
            duration: props.config?.rollTime,
            fill: 'forwards'
        })
    }

    function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) ) + min
    }

    function numberToOffset(num) {
        return (NUMBERS.indexOf(num) * 85) + 40
    }

    return (
        <>
            <div class='spinner-wrapper'>
                <img class='selector' src='/assets/icons/selector.png' alt='' width='20'/>
                <div class='spinner-container'>
                    <div class='icons' ref={icons}>
                        <For each={[...NUMBERS, ...NUMBERS, ...NUMBERS, ...NUMBERS, ...NUMBERS, ...NUMBERS, ...NUMBERS]}>{(num, index) =>
                            <RouletteIcon num={num} roll={props.roll} config={props.config}/>
                        }</For>
                    </div>
                </div>

                <div class='numbers-container'>
                    <div class='numbers' ref={numbers}>
                        <For each={[...NUMBERS, ...NUMBERS, ...NUMBERS, ...NUMBERS, ...NUMBERS, ...NUMBERS, ...NUMBERS]}>{(num, index) =>
                            <RouletteNumbers num={num} roll={props.roll} config={props.config}/>
                        }</For>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .spinner-wrapper {
                width: 100%;
                height: fit-content;
                
                display: flex;
                flex-direction: column;
                
                position: relative;
              }
              
              .spinner-container {
                width: 100%;
                height: 125px;

                border-radius: 7px 7px 0px 0px;
                background: rgba(27, 24, 46, 0.50);
                overflow: hidden;
                
                position: relative;
              }
              
              .numbers-container {
                width: 100%;
                height: 45px;
                margin-top: 1px;

                border-radius: 0px 0px 7px 7px;
                background: #2B2750;
                box-shadow: 0px 2px 0px 0px rgba(28, 26, 43, 0.45);
                overflow: hidden;

                position: relative;
              }
              
              .spinner-container:before {
                position: absolute;
                width: 100%;
                height: 100%;
                content: '';
                border-radius: 7px 7px 0px 0px;
                background: rgba(37, 34, 57, 0.01);
                box-shadow: 25px 0px 15px 0px rgba(0, 0, 0, 0.05) inset, -25px 0px 15px 0px rgba(0, 0, 0, 0.05) inset;
              }
              
              .icons, .numbers {
                display: flex;
                gap: 5px;
                align-items: center;
                
                width: 100%;
                height: 100%;

                overflow: visible;
                position: absolute;
                left: 50%;

                transform: translatex(-1910px);
              }
              
              .numbers {
                height: 100%;
              }
              
              .selector {
                position: absolute;
                transform: translateX(-8px);
                top: -10px;
                left: 50%;
                z-index: 1;
              }
            `}</style>
        </>
    );
}

export default RouletteSpinner;
