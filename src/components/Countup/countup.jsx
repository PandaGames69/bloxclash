import { createSignal, createEffect } from 'solid-js';
import {getCents} from "../../util/balance";

function Countup(props) {

    const [prev, setPrev] = createSignal(null)
    const [number, setNumber] = createSignal(0);

    createEffect(() => {
        if ((!prev() && !props.init) || props.downStep) {
            setPrev(props?.end || 0);
            setNumber(props?.end || 0);
            return;
        }

        let end = props?.end || 0;
        let start = prev() || 0;
        let steps = props?.steps || 20;
        let duration = props?.duration || 500;

        if (start === end) return;

        let step = (end - start) / steps; // No need to round steps here
        let currentNumber = start;
        let currentStep = 0;

        const interval = Math.floor(duration / steps);

        const updateNumber = () => {
            currentNumber += step;
            currentNumber = parseFloat(currentNumber.toFixed(2)); // Round to 2 decimal places
            setNumber(currentNumber);

            if (props?.end === 1.9)
                console.log(currentNumber)

            currentStep++;
            if (currentStep >= steps) {
                setNumber(end);
                setPrev(end);
                clearInterval(intervalId);
            }
        };

        const intervalId = setInterval(updateNumber, interval);
    });

    function properlyRoundNumber() {
        if (props?.gray) {
            if (number() < 0) return Math.ceil(number() * 100 / 100)?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
            return Math.floor(number() * 100 / 100)?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        }
        return number().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    return (
        <>
            {properlyRoundNumber()}
            {props?.gray && (
                <span class='gray'>.{getCents(number())}</span>
            )}
        </>
    )
}

export default Countup;
