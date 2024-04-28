import {createEffect, createSignal} from "solid-js";

function RouletteNumbers(props) {

    let num
    const [type, setType] = createSignal('green')

    createEffect(() => {
        switch(props.num) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                return setType('green')
            case 14:
            case 13:
            case 12:
            case 11:
            case 10:
            case 9:
            case 8:
                return setType('red')
            case 0:
            default:
                return setType('gold')
        }
    })

    createEffect(() => {
        if (typeof props.roll?.result === 'number') {
            rollSpinner(props.roll?.result)
        }
    })

    function rollSpinner(number) {
        if (number === props.num) return

        num.animate([
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
            <div ref={num} class={'spinner-number ' + (type())}>
                <p>{props.num}</p>
            </div>

            <style jsx>{`
              .spinner-number {
                min-width: 80px;
                width: 80px;
                height: 25px;
                
                display: flex;
                align-items: center;
                justify-content: center;

                font-size: 14px;
                font-family: Geogrotesque Wide;
                font-weight: 600;
              }
              
              .gold {
                border-radius: 2px;
                background: linear-gradient(37deg, rgba(255, 153, 0, 0.25) 30.03%, rgba(249, 172, 57, 0.25) 42.84%);
                border: 1px solid #D9AB19;
                
                color: #D9AB19;
              }
              
              .red {
                border-radius: 2px;
                border: 1px dashed #C53852;
                background: rgba(77, 39, 63, 0.55);

                color: #C53852;
              }
              
              .green {
                border-radius: 2px;
                border: 1px dashed #41D163;
                background: rgba(44, 77, 68, 0.55);

                color: #41D163;
              }
            `}</style>
        </>
    );
}

export default RouletteNumbers;
