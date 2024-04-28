import {createContext, useContext, createResource} from "solid-js";
import io from "socket.io-client";
import {getJWT} from "../util/api";

const WebsocketContext = createContext();

export function WebsocketProvider(props) {

    const [ws, { mutate }] = createResource(connectSocket), socket = [ws]

    async function connectSocket() {

        let tempWs = io(import.meta.env.VITE_SOCKET_URL + '', { transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 1000, reconnectionAttempts: 10})

        tempWs.on('connect', () => {
            console.log('Connected to WS')
            tempWs.emit('auth', getJWT())
            mutate(tempWs)
        })

        tempWs.on('disconnect', (reason) => {
            if (reason !== 'io server disconnect') return

            mutate(null)
            let retrying = setInterval(() => {
                tempWs.removeAllListeners()
                tempWs = io(import.meta.env.VITE_SERVER_URL, { transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 1000, reconnectionAttempts: 10})
                mutate(tempWs)
                clearInterval(retrying)
            }, 1000)
        })

    }

    return (
        <WebsocketContext.Provider value={socket}>
            {props.children}
        </WebsocketContext.Provider>
    );
}

export function useWebsocket() { return useContext(WebsocketContext); }