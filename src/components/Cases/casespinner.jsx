import SpinnerItem from "./spinneritem";
import {createEffect, For} from "solid-js";

function CaseSpinner(props) {

    let spinner

    createEffect(() => {
        if (props?.spinning === 'spinning') {
            animate()
        }
    })

    function animate() {

        const itemsWidth = 130 // 130px + 50px gap
        const center = (itemsWidth / 2)
        const itemsGap = 50
        const firstItem = 5 * (itemsWidth + itemsGap) + center
        const lastItem = 50 * (itemsWidth + itemsGap) + center

        spinner.animate(
            [
                {transform: `translatex(-${firstItem}px)`, offset: 0, easing: 'cubic-bezier(.05,.85,.3,1)'},
                {transform: `translatex(${-lastItem - props?.offset}px)`, offset: 0.9, easing: 'cubic-bezier(.05,.85,.3,1)'},
                {transform: `translatex(${-lastItem - props?.offset}px)`, offset: 0.95, easing: 'cubic-bezier(.05,.85,.3,1)'},
                {transform: `translatex(-${lastItem}px)`, offset: 1, easing: 'cubic-bezier(.05,.85,.3,1)'}
            ],
            {
                duration: props?.spinTime || 7000,
                fill: 'forwards'
            })
    }

    return (
        <>
            <div class='case-spinner-container'>
                <div class='spinner-items' ref={spinner}>
                    <For each={props?.items || []}>{(item, index) => <SpinnerItem spinTime={props?.spinTime} offset={props.offset} img={item.img}
                                                                                  spinning={props?.spinning}
                                                                                  price={item?.price}
                                                                                  index={index()} position={props?.position}/>}</For>
                </div>
                {/*<div class='bar'/>*/}
            </div>

            <style jsx>{`
              .case-spinner-container {
                flex: 1;
                min-width: 500px;

                min-height: 130px;
                height: 180px;

                border-radius: 10px;
                background: rgba(144, 138, 255, 0.06);
                overflow: hidden;
                position: relative;
              }

              .spinner-items {
                width: fit-content;
                height: 100%;

                display: flex;

                gap: 50px;

                position: absolute;
                left: 50%;
                transform: translateX(-785px); /* 65px is to center on first item, then 180px per item center after that due to 50px gap and 130px width */
              }

              .bar {
                width: 1px;
                height: 100%;
                background: red;
                position: absolute;
                left: 50%;
              }

              @media only screen and (max-width: 560px) {
                .case-spinner-container {
                  width: 100%;
                  min-width: unset;
                }
              }
            `}</style>
        </>
    );
}

export default CaseSpinner;
