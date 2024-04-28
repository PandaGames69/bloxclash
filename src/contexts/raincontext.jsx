import {createContext, useContext, createResource, createSignal, createEffect, onCleanup} from "solid-js";
import {useWebsocket} from "./socketprovider";

const RainContext = createContext();

export function RainProvider(props) {

    let [ws] = useWebsocket()

    const [time, setTime] = createSignal(0)
    const [userTimer, setUserTimer] = createSignal(0)

    const [userRain, setUserRain] = createSignal(null, { equals: false })
    const [rain, setRain] = createSignal({
        amount: 0,
        endsAt: -1,
        active: false,
    }, { equals: false })

    createEffect(() => {
        if (!rain() && rain().endsAt < Date.now()) return

        setTime(rain()?.endsAt - Date.now())
    })

    createEffect(() => {
        if (!ws()) return

        ws().off('rain')
        ws().on('rain', (pot, endsIn, active, joined) => {
            setRain({
                amount: pot,
                endsAt: Date.now() + endsIn,
                active: !!active,
                joined
            })
        })

        ws().on('rain:pot', (pot) => {
            setRain(rain => {
                let newRain = {...rain}
                newRain.amount = pot
                return newRain
            })
        })

        ws().on('rain:active', (pot, endsIn) => {
            setRain({
                amount: pot,
                endsAt: Date.now() + endsIn,
                active: true,
            })
        })

        ws().on('rain:user', (pot, endsIn, host, joined) => {
            setUserRain({
                amount: pot,
                endsAt: Date.now() + endsIn,
                host: host,
                joined
            })
        })

        ws().on('rain:end', () => {
            if (userRain()) {
                return setUserRain(null)
            }

            setRain(rain => {
                let newRain = {...rain}
                newRain.active = false
                return newRain
            })
        })
    })

    let timer = setInterval(() => {
        if (userRain()) {
            setUserTimer(Math.max(0, userRain().endsAt - Date.now()))
        }

        setTime(Math.max(0, rain().endsAt - Date.now()))
    }, 1000)
    onCleanup(() => clearInterval(timer))

    function joinedRain() {
        if (userRain()) {
            return setUserRain(rain => {
                let newRain = {...rain}
                newRain.joined = true
                return newRain
            })
        }

        setRain(rain => {
            let newRain = {...rain}
            newRain.joined = true
            return newRain
        })
    }

    return (
        <RainContext.Provider value={[rain, userRain, time, userTimer, joinedRain]}>
            {props.children}
        </RainContext.Provider>
    );
}

export function useRain() { return useContext(RainContext); }