import {addDropdown} from "../../util/api";
import {createEffect, createSignal, For} from "solid-js";

const rooms = {
    'EN': {
        icon: '/assets/icons/english.png',
        name: 'ENGLISH',
    },
    'TR': {
        icon: '/assets/icons/turkish.png',
        name: 'TURKISH',
        key: 'TR',
    },
    'GR': {
        icon: '/assets/icons/german.png',
        name: 'GERMAN',
    },
    'BEG': {
        icon: '/assets/icons/begging.png',
        name: 'BEGGING',
    },
    'VIP': {
        icon: '/assets/icons/whale.png',
        name: 'WHALE LOUNGE',
    },
}

function Chats(props) {

    const [active, setActive] = createSignal(false)
    addDropdown(setActive)

    function tryToSwitchRooms(roomKey) {
        if (props.ws) {
            props.ws.emit('chat:join', roomKey)
        }
    }

    return (
        <>
            <div class='chatrooms-container'>
                <div class='chats bevel' onClick={(e) => {
                    setActive(!active())
                    e.stopPropagation()
                    e.preventDefault()
                }}>
                    <img src={rooms[props.room].icon}/>

                    <p class='chat-name'>{rooms[props.room].name}</p>

                    <svg class={active() ? 'active' : ''} width="7" height="5" viewBox="0 0 7 5" fill="none"
                         xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M3.50001 0.994671C3.62547 0.994671 3.7509 1.04269 3.84655 1.13852L6.8564 4.15579C7.04787 4.34773 7.04787 4.65892 6.8564 4.85078C6.66501 5.04263 6.5 4.99467 6.16316 4.99467L3.50001 4.99467L1 4.99467C0.5 4.99467 0.335042 5.04254 0.14367 4.85068C-0.0478893 4.65883 -0.0478893 4.34764 0.14367 4.1557L3.15347 1.13843C3.24916 1.04258 3.3746 0.994671 3.50001 0.994671Z"
                            fill="#9489DB"/>
                    </svg>
                </div>

                <div class={'dropdown ' + (active() ? 'active' : '')} onClick={(e) => e.stopPropagation()}>
                    <div class='decoration-arrow'/>
                    <div class='rooms'>
                        <For each={Object.keys(rooms).filter(r => r !== props.room)}>{(roomKey, index) =>
                            <div class='room' onClick={() => {
                                tryToSwitchRooms(roomKey)
                            }}>
                                <img src={rooms[roomKey].icon} width='25' alt=''/>
                                <p>{rooms[roomKey].name}</p>

                                <div class='online'>
                                    <div class='dot'/>
                                    {props?.online?.channels[roomKey]}
                                </div>
                            </div>
                        }</For>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .chatrooms-container {
                width: 100%;
                height: 35px;

                font-family: 'Geogrotesque Wide', sans-serif;
                font-weight: 700;
                font-size: 14px;
                color: #ADA3EF;
                
                position: relative;
                z-index: 3;
              }
              
              .chats {
                width: 100%;
                height: 100%;

                display: flex;
                align-items: center;
                justify-content: space-between;

                padding: 0 15px;
                cursor: pointer;
                position: relative;
              }

              .chat-name {
                width: 100%;
                left: 0;
                position: absolute;
                text-align: center;

                user-select: none;
              }

              .dropdown {
                position: absolute;
                width: 100%;
                max-height: 0;
                
                top: 37px;
                left: 0;
                z-index: 1;

                border-radius: 3px 0 3px 3px;
                transition: max-height .3s;
                overflow: hidden;
                
                cursor: default;
              }

              .dropdown.active {
                max-height: 200px;
              }

              svg.active {
                transform: rotate(180deg);
              }

              .decoration-arrow {
                width: 13px;
                height: 9px;

                top: 1px;
                background: #201B3D;
                position: absolute;
                right: 0;
                
                border-left: 1px solid #2D2654;
                border-right: 1px solid #2D2654;
                border-top: 1px solid #2D2654;

                clip-path: polygon(0% 100%, 100% 0%, 100% 100%);
              }
              
              .rooms {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 10px;

                border: 1px solid #2D2654;
                background: #201B3D;
                
                margin-top: 9px;
              }
              
              .room {
                display: flex;
                align-items: center;
                text-align: left;
                
                height: 30px;

                background: #312A5E;
                box-shadow: 0px -1px 0px #3C3472, 0px 1px 0px #1B1734;
                border-radius: 3px;
                
                gap: 10px;
                padding: 0 7px;
                transition: background-color .3s;
                
                cursor: pointer;
              }
              
              .room:hover {
                background: #332f61;
              }
              
              .online {
                padding: 3px 5px;
                background: conic-gradient(from 180deg at 50% 50%, #59E878 -0.3deg, #459D7B 72.1deg, #407B64 139.9deg, #407C64 180.52deg, #37545C 215.31deg, #3B5964 288.37deg, #59E878 359.62deg, #59E878 359.7deg, #459D7B 432.1deg);
                border-radius: 3px;

                font-family: 'Geogrotesque Wide';
                font-weight: 700;
                font-size: 11px;
                color: #59E878;
                
                margin-left: auto;
                position: relative;
                z-index: 0;
                
                display: flex;
                align-items: center;
                gap: 5px;
              }
              
              .online:before {
                position: absolute;
                top: 1px;
                left: 1px;
                
                content: '';
                
                width: calc(100% - 2px);
                height: calc(100% - 2px);
                border-radius: 3px;

                z-index: -1;
                background: linear-gradient(0deg, rgba(89, 232, 120, 0.25), rgba(89, 232, 120, 0.25)), linear-gradient(252.77deg, #1A0E33 -27.53%, #423C7A 175.86%);
              }
              
              .dot {
                width: 10px;
                height: 10px;

                background: rgba(89, 232, 120, 0.25);
                border-radius: 2px;
                
                display: flex;
                align-items: center;
                justify-content: center;
                
                position: relative;
              }
              
              .dot:after {
                height: 5px;
                width: 5px;
                
                content: '';
                
                background: #59E878;
                box-shadow: 0px 0px 4px #59E878;
                border-radius: 2px;
              }
            `}</style>
        </>
    );
}

export default Chats;
