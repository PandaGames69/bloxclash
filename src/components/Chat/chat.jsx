import {createEffect, createSignal, For} from "solid-js";
import ChatMessage from "./message";
import RainEnd from "./rainend";
import SystemMessage from "./systemmessage";
import RainTip from "./raintip";
import {useUser} from "../../contexts/usercontextprovider";
import {addDropdown} from "../../util/api";

function Chat(props) {

    let sendRef
    let messagesRef
    let chatRef
    let hasLoaded = false

    const [user] = useUser()
    const [text, setText] = createSignal('')

    const [top, setTop] = createSignal(0)
    const [scroll, setScroll] = createSignal(true)

    const [replying, setReplying] = createSignal()

    const [emojisOpen, setEmojisOpen] = createSignal(false)
    addDropdown(setEmojisOpen)

    createEffect(() => {
        if (replying() || !replying()) // just to proc the effect
            sendRef.select()
    })

    createEffect(() => {
        if (!chatRef) return

        chatRef.onscroll = (e) => {
            let maxScroll = e.target.scrollHeight - e.target.clientHeight
            if (e.target.scrollTop >= maxScroll) {
                setScroll(true)
                return
            }

            if (!top()) return setTop(e.target.scrollTop)

            if (e.target.scrollTop < top() - 100) {
                setScroll(false)
                setTop(e.target.scrollTop)
                return
            }
        }
    })

    createEffect(() => {
        if (props.messages.length === 0 || !scroll()) return

        messagesRef.scrollIntoView({block: 'nearest', inline: 'end', behavior: hasLoaded ? 'smooth' : 'instant'})
        setTop(chatRef.scrollTop)
        hasLoaded = true
    })

    function resumeScrolling() {
        setScroll(true)
        messagesRef.scrollIntoView({block: 'nearest', inline: 'end', behavior: 'instant'})
        setTop(chatRef.scrollTop)
    }

    function sendMessage(message) {
        message = message.trim()
        if (message.length < 1) {
            return
        }

        if (replying() && !message.includes('@')) {
            message = `@${getReplyingTo().user.username} ${message}`
        }

        props.ws.emit('chat:sendMessage', message, replying())
        setTimeout(() => {
            setText('')
            setReplying(null)
        }, 1)
    }

    const handleKeyPress = (e, message) => {
        if (e.key === 'Backspace' && message.length === 0) {
            setReplying(null)
        }

        if (e.key === 'Enter' && props.ws) {
            sendMessage(message)
        }
    }

    function getReplyingTo() {
        return props?.messages?.find(msg => msg.id === replying())
    }

    function getRepliedMessage(id) {
        if (!id) return 'Unknown'
        let msg = props?.messages?.find(m => m.id === id)
        return msg?.content || 'Unknown'
    }

    return (
        <>
            <div class='chat-container'>
                <div class='messages' ref={chatRef}>
                    <div class='pusher'/>
                    <For each={props.messages}>{(message, index) =>
                        message?.type === 'rain-end' ? (
                            <RainEnd {...message}/>
                        ) : message?.type === 'system' ? (
                            <SystemMessage {...message}/>
                        ) : message?.type === 'rain-tip' ? (
                            <RainTip {...message}/>
                        ) : (
                            <ChatMessage {...message} actualUser={user()}
                                         ws={props?.ws} emojis={props?.emojis}
                                         replying={replying()} setReplying={setReplying}
                                         repliedMessage={getRepliedMessage(message.replyTo)}
                            />
                        )}
                    </For>
                    <div ref={messagesRef}/>
                </div>

                {!scroll() && (
                    <div class='paused' onClick={() => resumeScrolling()}>
                        <p>Chat paused due to scroll</p>
                    </div>
                )}

                <div class='send-message'>
                    <div class='message-wrapper'>
                        {replying() && (
                            <p class='replyto'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none">
                                    <path d="M5 2.50112V0.375123C5 0.224623 4.9095 0.0886233 4.771 0.0296233C4.633 -0.0288767 4.4715 0.000623226 4.364 0.106123L0.114 4.23112C0.041 4.30162 0 4.39862 0 4.50012C0 4.60162 0.041 4.69862 0.114 4.76912L4.364 8.89412C4.4725 8.99912 4.6335 9.02862 4.771 8.97062C4.9095 8.91162 5 8.77562 5 8.62512V6.50012H5.709C8.027 6.50012 10.164 7.76012 11.2855 9.78612L11.296 9.80512C11.363 9.92712 11.49 10.0001 11.625 10.0001C11.656 10.0001 11.687 9.99662 11.718 9.98862C11.884 9.94612 12 9.79662 12 9.62512C12 5.73812 8.8715 2.56812 5 2.50112Z" fill="#7771C5"/>
                                </svg>
                                @{getReplyingTo().user.username}
                            </p>
                        )}

                        <input type='text' class='send-message-input' placeholder='Send a message...'
                               value={text()}
                               ref={sendRef}
                               onChange={(e) => setText(e.target.value)}
                               onKeyDown={(e) => handleKeyPress(e, e.target.value)}/>
                    </div>

                    <div class='emojis-button' onClick={(e) => {
                        setEmojisOpen(!emojisOpen())
                        e.stopPropagation()
                    }}>
                        <img src='/assets/icons/emojis.png' height='20' alt=''/>

                        {emojisOpen() && (
                            <div className='emojis-wrapper' onClick={(e) => e.stopPropagation()}>
                                <div className='emojis'>
                                    <For each={props?.emojis}>{(emoji) =>
                                        <img src={emoji.url} className='emoji' alt={`:${emoji.name}:`} height='24'
                                             width='24'
                                             onClick={() => setText(text() + ` :${emoji.name}:`)}/>
                                    }</For>
                                </div>
                            </div>
                        )}
                    </div>

                    <div class='send bevel' onClick={() => sendMessage(text())}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="#7771C5"
                             xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M6.35156 2.84522C2.83113 3.02855 0 5.95057 0 9.51562V12L0.888867 9.9307C1.94013 7.82855 4.02591 6.48443 6.35156 6.36084V9.20423L11.9918 4.59375L6.35156 0V2.84522Z"/>
                        </svg>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .chat-container {
                width: 100%;
                height: 100%;

                padding: 0px 0px 20px 0px;

                display: flex;
                flex-direction: column;
                box-sizing: border-box;

                gap: 5px;
                overflow: hidden;
                position: relative;
              }

              .messages {
                width: 100%;
                height: 100%;

                padding: 0 15px;

                display: flex;
                flex-direction: column;
                position: relative;

                gap: 15px;
                overflow-y: scroll;

                mask-image: linear-gradient(to top, black 80%, rgba(0, 0, 0, 0.25) 99%);
                scrollbar-color: transparent transparent;
              }

              .messages::-webkit-scrollbar {
                display: none;
              }

              .pusher {
                flex: 1 1 auto;
              }

              .paused {
                min-height: 50px;
                width: 100%;

                border-left: 2px solid var(--gold);
                background: rgba(28, 25, 53, 0.93);

                cursor: pointer;
                line-height: 50px;
                text-align: center;

                color: #8A81B4;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 13px;
                font-weight: 600;
              }

              .send-message {
                background: var(--fifth-bg);

                border: 1px solid #3E3771;
                border-radius: 3px;

                min-height: 50px;
                width: 270px;
                padding: 0 10px;
                margin: 0 auto;

                display: flex;
                align-items: center;
                gap: 10px;
              }
              
              .message-wrapper {
                display: flex;
                height: 100%;
                flex: 1;
                gap: 4px;
                align-items: center;
              }

              .send-message-input {
                width: 100%;
                height: 100%;

                background: unset;
                border: unset;
                outline: unset;

                font-family: 'Rubik', sans-serif;
                font-weight: 400;
                font-size: 13px;
                color: #7A72AF;
              }

              .send-message-input::placeholder {
                font-family: 'Rubik', sans-serif;
                font-weight: 400;
                font-size: 13px;
                color: #7A72AF;
                user-select: none;
              }

              .send {
                min-height: 32px;
                min-width: 32px;

                display: flex;
                align-items: center;
                justify-content: center;

                cursor: pointer;
              }

              .send svg {
                transition: fill .3s;
              }

              .send:hover svg {
                fill: #6862B0;
              }
              
              .replyto {
                display: flex;
                align-items: center;
                gap: 4px;
                
                color: #8F7FFF;
                font-family: Rubik;
                font-size: 13px;
                font-style: normal;
                font-weight: 400;
                line-height: normal;
              }

              .emojis-button {
                min-width: 26px;
                height: 26px;

                border-radius: 3px;
                border: 1px solid #363266;
                background: rgba(54, 50, 102, 0.50);

                display: flex;
                align-items: center;
                justify-content: center;

                cursor: pointer;
              }

              .emojis-wrapper {
                width: 270px;
                height: 170px;

                position: absolute;
                bottom: 80px; /* 20px padding, 50px message box, 10px from message box */

                border-radius: 3px;
                border: 1px solid #363266;
                background: #2E2958;

                padding: 12px 6px 12px 12px;
                overflow-y: scroll;

                display: flex;

                left: 0;
                right: 0;
                margin: 0 auto;
                cursor: initial;
              }

              .emojis-wrapper::-webkit-scrollbar {
                width: 3px;
              }

              .emojis-wrapper::-webkit-scrollbar-track {
                background: #221F3D;
              }

              .emojis-wrapper::-webkit-scrollbar-thumb {
                background: #635C9C;
              }

              .emojis {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
              }

              .emoji {
                cursor: pointer;
              }
            `}</style>
        </>
    );
}

export default Chat;
