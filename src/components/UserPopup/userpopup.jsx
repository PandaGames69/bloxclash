import Avatar from "../Level/avatar";
import Level from "../Level/level";
import {api, authedAPI, createNotification} from "../../util/api";
import {createResource, createSignal, Show} from "solid-js";
import Loader from "../Loader/loader";
import {useSearchParams} from "@solidjs/router";
import {useWebsocket} from "../../contexts/socketprovider";

function UserModal(props) {

  const [params, setParams] = useSearchParams()
  const [user] = createResource(() => params.user, getUser)
  const [tip, setTip] = createSignal(0)
  const [ws] = useWebsocket()

  async function getUser(userid) {
    try {
      let res = await api(`/user/${userid}/profile`, 'GET', null, true)

      return res
    } catch (e) {
      console.error(e)

      return
    }
  }

  function tipUser() {
    if (!ws() || !ws().connected || tip() < 1) return
    console.log('test')

    ws().emit('chat:sendMessage', `/tip ${user().username} ${tip()}`)
    setTip(0)
  }

  return (
    <>
      <div className='modal' onClick={() => setParams({ user: null })}>
        <div class='user-container' onClick={(e) => e.stopPropagation()}>
          <Show when={!user.loading} fallback={<Loader/>}>
            <>
              <div className='user-header'>
                <p className='close bevel-light' onClick={() => setParams({ user: null })}>X</p>
                <h1><img src='/assets/icons/user.svg' style={{margin: '0 8px 0 0'}}/>USER PROFILE</h1>

                <div className='user-info'>
                  <Avatar id={user()?.id || 0} xp={user()?.xp || 0} height='35'/>
                  <p>{user()?.username || 'Unknown'}</p>
                  <Level xp={user()?.xp || 0}/>
                </div>
              </div>

              <div className='user-content'>
                <div className='stats'>
                  <div className='stat'>
                    <p className='white align'>
                      <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                      {(user()?.wagered || 0)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p>TOTAL WAGERED</p>
                  </div>

                  <div className='stat'>
                    <p className='white align'>
                      <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                      {(user()?.withdraws || 0)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p>WITHDRAWN</p>
                  </div>

                  <div className='stat'>
                    <p className='white align'>
                      <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                      {(user()?.deposits || 0)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p>DEPOSITED</p>
                  </div>

                  <div className='stat green'>
                    <p className='white align'>
                      <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                      {((user()?.withdraws - user()?.deposits) || 0)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p className='green'>TOTAL PROFIT</p>
                  </div>
                </div>

                {props?.user && (
                    <>
                      <div className='tip-wrapper'>
                        <p className='input-label'>TIP USER</p>

                        <div class='input-wrapper'>
                          <img class='coin' src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                          <input type='number' value={tip()} onInput={(e) => setTip(e.target.valueAsNumber)}/>
                        </div>

                        <button className='bevel-gold' onClick={() => tipUser()}>TIP PLAYER</button>
                      </div>

                      <p>
                        Please keep in mind that tipping is an irreversable action, and you are the only one responsible for
                        pulling the trigger. We will not in any circumstances refund on your or another user’s behalf.
                        Double check the tip amount, and who you are tipping.
                      </p>
                    </>
                )}
              </div>
            </>
          </Show>
        </div>
      </div>

      <style jsx>{`
        .modal {
          position: fixed;
          top: 0;
          left: 0;

          width: 100vw;
          height: 100vh;

          background: rgba(24, 23, 47, 0.55);

          display: flex;
          align-items: center;
          justify-content: center;

          z-index: 1000;
        }

        .user-container {
          max-width: 880px;
          color: white;

          width: 100%;
          max-height: 80%;

          background: #2C2952;
          box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
          border-radius: 15px;

          display: flex;
          flex-direction: column;
          align-items: center;
          font-weight: 700;

          position: relative;
          overflow: scroll;
          scrollbar-color: transparent transparent;
        }

        .user-container::-webkit-scrollbar {
          display: none;
        }

        .user-header {
          width: 100%;
          min-height: 60px;
          background: #322F5F;

          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 15px;
        }

        h1 {
          color: #FFF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 16px;
          font-weight: 700;
        }

        .close {
          width: 26px;
          height: 26px;

          background: #4E4A8D;
          box-shadow: 0px -1px 0px #5F5AA7, 0px 1px 0px #272548;
          border-radius: 3px;

          display: flex;
          align-items: center;
          justify-content: center;

          font-weight: 700;
          color: #ADA3EF;
          cursor: pointer;
        }

        .id {
          color: #9F9AC8;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 14px;
          font-weight: 500;
        }

        .user-info {
          display: flex;
          gap: 10px;
          align-items: center;

          margin-left: auto;
        }

        .user-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 25px;
          text-align: center;

          color: #7A72B0;
          font-size: 14px;
          font-weight: 400;
          
          padding: 30px 20px;
          width: 100%;
        }

        .stats {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          width: 100%;
        }

        .stat {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;

          flex: 1 1 0;
          height: 90px;

          border-radius: 5px;
          background: rgba(90, 84, 153, 0.27);

          color: #FFF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 20px;
          font-weight: 600;

          padding: 10px 20px;
        }

        .stat.green {
          background: rgba(89, 232, 120, 0.15);
        }

        .stat p:last-child {
          color: #ADA3EF;
          font-size: 13px;
          font-weight: 600;
        }

        .align {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .green {
          color: #59E878 !important;
        }

        .tip-wrapper {
          width: 100%;
          max-width: 570px;
          min-height: 50px;
          
          display: flex;
          align-items: center;
          gap: 12px;

          border-radius: 5px;
          border: 1px dashed #464075;
          background: rgba(0, 0, 0, 0.12);
          
          padding: 12px;
        }
        
        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          
          flex: 1;
        }
        
        .input-label {
          padding: 0 10px;
          height: 26px;

          color: #ADA3EF;
          font-size: 12px;
          font-weight: 600;
          line-height: 26px;
          
          border-radius: 2px;
          background: rgba(90, 84, 153, 0.35);
        }
        
        .tip-wrapper input {
          height: 100%;
          flex: 1;

          color: #FFF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 15px;
          font-weight: 600;
          
          background: unset;
          outline: unset;
          border: unset;
        }
        
        .tip-wrapper button {
          padding: 0 16px;
          height: 28px;
        }

        @media only screen and (max-width: 600px) {
          .tip-wrapper {
            flex-direction: column;
          }
          
          .tip-wrapper input {
            text-align: center;
          }
          
          .coin {
            display: none;
          }
          
          .stats {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  )
}

export default UserModal