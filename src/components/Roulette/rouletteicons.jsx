import {createEffect, createSignal} from "solid-js";
import {numberToColor} from "../../util/roulettehelpers";

function RouletteIcon(props) {

    let icon
    const [type, setType] = createSignal('green')

    createEffect(() => setType(numberToColor(props.num)))

    createEffect(() => {
        if (typeof props.roll?.result === 'number') {
            rollSpinner(props.roll?.result)
        }
    })

    function rollSpinner(number) {
        if (number === props.num) return

        icon.animate([
            { filter: 'grayscale(0%)', offset: 0 },
            { filter: 'grayscale(100%)', offset: 0.05 },
            { filter: 'grayscale(100%)', offset: 0.9 },
            { filter: 'grayscale(0%)', offset: 0.95 },
            { filter: 'grayscale(0%)', offset: 1}
        ], {
            iterations: 1,
            duration: 2000,
            delay: props.config?.rollTime
        })
    }

    return (
        <>
            <div ref={icon} class={'spinner-icon ' + (type()) + ' ' + (props.size || 'large')}></div>

            <style jsx>{`
              .spinner-icon {
                border-radius: 5px;
                
                display: flex;
                align-items: center;
                justify-content: center;

                background-size: 36px 64px !important;
              }
              
              .small {
                min-width: 35px;
                width: 35px;
                height: 40px;
                background-size: 14px 28px !important;
              }
              
              .large {
                min-width: 80px;
                width: 80px;
                height: 100px;
              }
              
              .gold {
                background: rgba(217, 171, 25, 0.04);
                background-image: url("/assets/icons/goldsword.png");
                background-position: center;
                background-repeat: no-repeat;
                border: 1px solid #D9AB19;
              }
              
              .red {
                border: 1px solid #C53852;
                background: rgba(197, 56, 82, 0.04);
                background-image: url("/assets/icons/redtiki.png");
                background-position: center;
                background-repeat: no-repeat;
              }
              
              .green {
                border: 1px solid #41D163;
                background: rgba(65, 209, 99, 0.04);
                background-image: url("/assets/icons/greentiki.png");
                background-position: center;
                background-repeat: no-repeat;
              }
              
              .index {
                color: white;
                position: absolute;
                top: 5px;
                left: 5px;
                font-weight: 800;
              }
            `}</style>
        </>
    );
}

export default RouletteIcon;
