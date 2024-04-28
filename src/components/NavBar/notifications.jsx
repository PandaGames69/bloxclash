import {createEffect, createResource, createSignal, For, Show} from "solid-js";
import {useWebsocket} from "../../contexts/socketprovider";
import {addDropdown, authedAPI} from "../../util/api";
import Loader from "../Loader/loader";
import Notification from "./notification";
import {useUser} from "../../contexts/usercontextprovider";

function Notifications(props) {

  const [user, { setNotifications }] = useUser()
  const [active, setActive] = createSignal(false)
  const [notifications, {mutate}] = createResource(() => active(), fetchNotifications)
  const [ws] = useWebsocket()

  addDropdown(setActive)

  createEffect(() => {
    if (ws() && ws().connected) {
      ws().on('notifications', (type, notis) => {
        if (type === 'set') return setNotifications(notis)

        let newNotis = user().notifications + notis
        setNotifications(newNotis)
      })
    }
  })

  async function fetchNotifications(dropdownActive) {
    if (!dropdownActive) return

    try {
      let notisRes = await authedAPI('/user/notifications', 'GET', null, false)
      return Array.isArray(notisRes) ? notisRes : []
    } catch (e) {
      return []
    }
  }

  function removeNotification(id) {
    let index = notifications().findIndex(noti => noti.id === id)

    if (index < 0) return
    mutate([
      ...notifications().slice(0, index),
      ...notifications().slice(index + 1)
    ])
  }

  return (
    <>
      <div className='notifications' onClick={(e) => {
        setActive(!active())
        e.stopPropagation()
      }}>
        <div className='bell'>
          <img src='/assets/icons/bell.svg' height='18' width='23' alt=''/>

          {user().notifications > 0 && (
            <div className='alert'>
              <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12.0001 6.14308C12.0001 2.84753 9.38604 0.175903 6.16129 0.175903C2.93653 0.175903 0.322266 2.84753 0.322266 6.14308C0.322266 9.43863 2.93653 12.1103 6.16129 12.1103C9.38604 12.1103 12.0001 9.43863 12.0001 6.14308Z"
                  fill="#FC4747"/>
                <path
                  d="M7.72783 0.393555C9.21689 1.47489 10.1883 3.25202 10.1883 5.26108C10.1883 8.55662 7.57422 11.2283 4.34946 11.2283C3.80663 11.2283 3.2813 11.1524 2.78271 11.0106C3.73622 11.7032 4.90213 12.1103 6.16108 12.1103C9.38564 12.1103 11.9999 9.43864 11.9999 6.1431C11.9999 3.40221 10.1916 1.09337 7.72783 0.393555Z"
                  fill="#CC2B2B"/>
              </svg>

              <p>{user().notifications}</p>
            </div>
          )}

          <div class={'dropdown' + (active() ? ' active' : '')} onClick={(e) => e.stopPropagation()}>
            <div class='decoration-arrow'/>
            <div class='notis-wrapper'>
              <div class='notis'>
                <Show when={!notifications.loading} fallback={<Loader max={'20px'}/>}>
                  {notifications()?.length > 0 ? (
                    <For each={notifications()}>{(noti) =>
                      <Notification {...noti} delete={() => removeNotification(noti.id)}/>
                    }</For>
                  ) : (
                    <div class='none'>
                      <p>No new notifications...</p>
                    </div>
                  )}
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .notifications {
          height: 43px;
          width: 43px;

          border-radius: 4px;
          border: 1px solid #B17818;
          background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);

          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;
        }

        .bell {
          position: relative;
        }

        .alert {
          width: 12px;
          height: 12px;

          position: absolute;
          top: -4px;
          right: 0;

          line-height: 12px;
          text-align: center;

          font-family: "Geogrotesque Wide", sans-serif;
          font-size: 10px;
          font-weight: 700;
          color: white;
        }

        .alert > p {
          position: relative;
          z-index: 1;
        }

        .alert > svg {
          position: absolute;
          top: 0;
          left: 0;
        }

        .dropdown {
          position: absolute;
          min-width: 300px;
          max-height: 0;
          height: 240px;

          top: 55px;
          right: 0;
          z-index: 1;

          border-radius: 3px 0 3px 3px;
          transition: max-height .3s;
          overflow: hidden;

          cursor: default;
        }

        .dropdown.active {
          max-height: 240px;
        }

        svg.active {
          transform: rotate(180deg);
        }

        .decoration-arrow {
          width: 13px;
          height: 9px;

          top: 1px;
          background: #26214A;
          position: absolute;
          right: 0;

          border-left: 1px solid #3A336D;
          border-right: 1px solid #3A336D;
          border-top: 1px solid #3A336D;

          clip-path: polygon(0% 100%, 100% 0%, 100% 100%);
          z-index: 1;
        }

        .mobile .decoration-arrow {
          display: none;
        }

        .notis-wrapper {
          padding: 10px;

          border: 1px solid #3A336D;
          background: #26214A;

          margin-top: 8px;
          height: 100%;
          
          position: relative;
        }
        
        .notis {
          width: 100%;
          height: 100%;

          display: flex;
          flex-direction: column;
          gap: 6px;
          
          overflow-y: auto;
        }
        
        .notis::-webkit-scrollbar {
          display: none;
        }
        
        .none {
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;

          color: rgba(154, 144, 209, 0.75);
          font-weight: 700;
          
          overflow: hidden;
        }

        @media only screen and (max-width: 1000px) {
          .notifications {
            width: 35px;
            height: 35px;
          }
        }
      `}</style>
    </>
  );
}

export default Notifications
