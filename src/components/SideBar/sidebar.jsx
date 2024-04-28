import Chat from "../Chat/chat";
import Chats from "./chats";
import TipRain from "./tiprain";
import ChatRules from "./chatrules";
import {createEffect, createSignal, onCleanup} from "solid-js";
import {useWebsocket} from "../../contexts/socketprovider";
import GreenCount from "../Count/greencount";
import {useRain} from "../../contexts/raincontext";
import {createNotification} from "../../util/api";
import SidebarRain from "./rain";
import {A} from "@solidjs/router";

function SideBar(props) {

  let previousState = false
  const [rain, userRain] = useRain()
  const [messages, setMessages] = createSignal([], {equals: false})
  const [room, setRoom] = createSignal('EN')
  const [online, setOnline] = createSignal({
    total: 0,
    channels: {
      VIP: 0,
      EN: 1,
      BEG: 0,
      GR: 0,
      TR: 0
    }
  })
  const [emojis, setEmojis] = createSignal([])
  const [ws] = useWebsocket()

  createEffect(() => {
    if (ws() && !previousState) {
      ws().emit('chat:join', 'EN')
    }

    if (ws()) {
      ws().on('chat:pushMessage', (m) => {
        let newMessages = [...messages(), ...m].slice(-50)
        setMessages(newMessages)
      })

      ws().on('toast', (type, content, config = { duration: 3000 }) => {
        createNotification(type, content, config)
      });

      ws().on('chat:emojis', (emojis) => setEmojis(emojis))
      ws().on('chat:clear', () => setMessages([]))
      ws().on('misc:onlineUsers', (data) => setOnline(data))
      ws().on('chat:join', (response) => {
        if (!response.success) return
        setRoom(response.channel)
        setMessages([])
      })
      ws().on('chat:deleteMessage', (id) => {
        let index = messages().findIndex(message => message.id === +id)
        if (index < 0) return
        setMessages([
          ...messages().slice(0, index),
          ...messages().slice(index + 1)
        ])
      })
    }

    previousState = ws() && ws().connected
  })

  onCleanup(() => {
    if (!ws()) return

    ws().off('chat:pushMessage')
    ws().off('chat:clear')
    ws().off('misc:onlineUsers')
    ws().off('chat:join')
    ws().off('chat:deleteMessage')
  })

  return (
    <>
      <div class={'sidebar-container ' + (props.chat ? 'active' : '')}>
        <div class='top-container'>
          {!rain()?.active && !userRain() ? (
            <div className='logo-container'>
              <img src='/assets/logo/blox-clash-logo.gif' height='90'/>
              <img src='/assets/logo/blox-clash-words.png' height='21'/>
              <A href='/' class='gamemode-link'></A>
            </div>
          ) : (
            <SidebarRain/>
          )}
        </div>

        <div class='options'>
          <Chats online={online()} ws={ws()} room={room()}/>

          <div class='split'>
            <ChatRules/>
            <GreenCount active={true} number={online()?.total} css={{'flex': '1'}}/>
          </div>

          <TipRain/>
        </div>

        <Chat messages={messages()} ws={ws()} emojis={emojis()}/>
      </div>

      <style jsx>{`
        .sidebar-container {
          min-width: 300px;
          width: 300px;
          height: 100vh;
          max-height: 100vh;

          display: flex;
          flex-direction: column;

          background: var(--gradient-bg);
          overflow: hidden;
          transition: left .3s;
        }

        .options {
          padding: 15px 15px;

          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .split {
          display: flex;
          gap: 10px;
        }

        .split > * {
          flex: 1;
        }

        .top-container {
          width: 100%;
          min-height: 180px;
          background: rgb(23, 20, 48);
          position: relative;
        }

        .logo-container {
          width: 100%;
          min-height: 100%;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;
          gap: 20px;

          position: relative;

          background: linear-gradient(277.39deg,rgba(19,17,41,.65) -69.8%, rgba(37, 31, 78, .65) 144.89%);
        }

        .logo-container > * {
          position: relative;
          z-index: 1;
        }

        .logo-container:after {
          position: absolute;
          left: 0;
          top: 0;

          content: '';

          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom right, rgba(37, 31, 78, .7), rgba(19, 17, 41, .95)), url('/assets/icons/bgsword.png');
          background-size: cover;
          background-position: 50%;

          z-index: 0;
        }

        @media only screen and (max-width: 1250px) {
          .sidebar-container {
            position: fixed;
            top: 0;
            left: -300px;
            height: calc(100% - 60px);
            z-index: 4;
          }

          .sidebar-container.active {
            top: 0;
            left: 0;
          }
        }
      `}</style>
    </>
  );
}

export default SideBar;
