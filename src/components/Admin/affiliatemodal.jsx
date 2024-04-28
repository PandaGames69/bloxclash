import Avatar from "../Level/avatar";
import Level from "../Level/level";
import Switch from "../Toggle/switch";
import {authedAPI, createNotification} from "../../util/api";
import {createEffect, createSignal, Show} from "solid-js";
import Loader from "../Loader/loader";

function UserAffiliateModal(props) {

  createEffect(() => {
    if (!props?.user?.id) return

    setLock(props?.user?.affiliateCodeLock)
    setCode(props?.user?.affiliateCode || '')
    setEarnings(props?.user?.pendingAffiliateEarnings || 0)
  }, [props?.user])

  const [lock, setLock] = createSignal(false)
  const [code, setCode] = createSignal(0)
  const [earnings, setEarnings] = createSignal(0)

  return (
    <>
      <div className='modal' onClick={() => props?.close()}>
        <div class='user-container' onClick={(e) => e.stopPropagation()}>
          <Show when={!props?.loading && props?.user?.id} fallback={<Loader/>}>
            <>
              <div className='user-header'>
                <p className='close bevel-light' onClick={() => navigate('/')}>X</p>
                <h1><img src='/assets/icons/user.svg' style={{margin: '0 8px 0 0'}}/>ADMIN SETTINGS</h1>

                <div className='user-info'>
                  <p className='id'><span className='gold bold'>ACCOUNT ID</span> {props?.user?.id}
                  </p>

                  <Avatar id={props?.user?.id || 0} xp={props?.user?.xp || 0} height='35'/>
                  <p>{props?.user?.username || 'Unknown'}</p>
                  <Level xp={props?.user?.xp || 0}/>
                </div>
              </div>

              <div className='user-content'>
                <div className='stats'>
                  <div className='stat'>
                    <p className='white align'>
                      {props?.user?.affiliatedUsersCount || 0}
                    </p>
                    <p>USERS</p>
                  </div>

                  <div className='stat'>
                    <p className='white align'>
                      <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                      {(props?.user?.affiliatedUsersDepositedCount || 0)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p>DEPOSITED</p>
                  </div>

                  <div className='stat'>
                    <p className='white align'>
                      <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                      {(props?.user?.affiliatedUsersWageredCount || 0)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p>WAGERED</p>
                  </div>

                  <div className='stat'>
                    <p className='white align'>
                      <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                      {(props?.user?.affiliatedUsersWithdrawedCount || 0)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p>WITHDRAWN</p>
                  </div>
                </div>

                <div className='bar' style={{margin: '25px 0 35px 0'}}/>

                <div className='settings'>
                  <div className='table-data'>
                    <div className='table-column'>
                      <p>LOCK AFFILIATE CODE</p>
                    </div>

                    <div className='table-column'>
                      <Switch dark={true} active={lock()} toggle={async () => {
                        let res = await authedAPI(`/admin/users/affiliates/${props?.user?.id}/lock`, 'POST', JSON.stringify({
                          lock: !lock()
                        }), true)

                        if (res?.success) {
                          setLock(!lock())
                          createNotification('success', `Successfully ${lock() ? '' : 'un'}locked ` + props?.user?.username)
                        }
                      }}/>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>CLEAR AFFILIATES</p>
                    </div>

                    <div className='table-column'>
                      <button className='unlink' onClick={async () => {
                        let res = await authedAPI(`/admin/users/affiliates/${props?.user?.id}/clear`, 'POST', null, true)

                        if (res?.success) {
                          createNotification('success', `Successfully cleared ${props?.user?.username}'s affiliates.`)
                        }
                      }}>CLEAR
                      </button>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>REMOVE AFFILIATE CODE</p>
                    </div>

                    <div className='table-column'>
                      <button className='unlink' onClick={async () => {
                        let res = await authedAPI(`/admin/users/affiliates/${props?.user?.id}/removeCode`, 'POST', null, true)

                        if (res?.success) {
                          createNotification('success', `Successfully removed ${props?.user?.username}'s affiliates code.`)
                        }
                      }}>REMOVE
                      </button>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>SET AFFILIATE CODE</p>
                    </div>

                    <div className='table-column'>
                      <div className='input-wrapper'>
                        <div className='input-label'>CODE</div>
                        <input className='input gold' placeholder='0' value={code()}
                               onInput={(e) => setCode(e.target.value)}/>
                      </div>

                      <button className='bevel-light update' onClick={async () => {
                        let res = await authedAPI(`/admin/users/affiliates/${props?.user?.id}/setCode`, 'POST', JSON.stringify({
                          code: code()
                        }), true)

                        if (res?.success) {
                          createNotification('success', `Successfully set ${props?.user?.username}'s affiliate code to ${code()}`)
                        }
                      }}>UPDATE
                      </button>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>SET EARNINGS</p>
                    </div>

                    <div className='table-column'>
                      <div className='input-wrapper'>
                        <img src='/assets/icons/coin.svg' height='16' width='16' alt=''/>
                        <input className='input' type='number' placeholder='0' value={earnings()}
                               onInput={(e) => setEarnings(e.target.valueAsNumber)}/>
                      </div>

                      <button className='bevel-light update' onClick={async () => {
                        let res = await authedAPI(`/admin/users/affiliates/${props?.user?.id}/earnings`, 'POST', JSON.stringify({
                          earnings: earnings()
                        }), true)

                        if (res?.success) {
                          createNotification('success', `Successfully set ${props?.user?.username}'s pending earnings to ${earnings()}`)
                        }
                      }}>UPDATE
                      </button>
                    </div>
                  </div>
                </div>
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

        .bar {
          width: 100%;
          height: 1px;
          min-height: 1px;
          background: #5A5499;
        }

        .settings {
          display: flex;
          flex-direction: column;
          border-radius: 5px;
          overflow: hidden;
        }

        .table-header, .table-data {
          display: flex;
          justify-content: space-between;
        }

        .table-data {
          height: 55px;
          background: rgba(90, 84, 153, 0.35);
          padding: 0 20px;

          display: flex;
          align-items: center;

          color: #ADA3EF;
          font-size: 14px;
          font-weight: 600;
        }

        .table-data:nth-of-type(2n) {
          background: rgba(90, 84, 153, 0.15);
        }

        .table-column {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1 1 0;
          text-transform: uppercase;
        }

        .table-column:nth-of-type(2n) {
          justify-content: flex-end;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          height: 37px;
          gap: 10px;
          padding: 8px;

          border-radius: 5px;
          background: rgba(0, 0, 0, 0.15);

          width: 100%;
          max-width: 220px;
        }

        .input-label {
          padding: 3px 6px;
          font-family: Geogrotesque Wide, sans-serif;
          color: #ADA3EF;
          font-weight: 700;

          border-radius: 5px;
          background: rgba(0, 0, 0, 0.15);
        }

        .input {
          width: 100%;
          height: 100%;
          background: unset;
          border: unset;
          outline: unset;

          font-family: Geogrotesque Wide, sans-serif;
          font-weight: 700;
          color: white;
        }

        option {
          background: rgba(90, 84, 153, 1);
        }

        .update, .set, .unlink {
          border: unset;
          outline: unset;
          width: 80px;
          height: 33px;
          font-family: Geogrotesque Wide, sans-serif;
          font-weight: 700;
          cursor: pointer;
          border-radius: 3px;
        }

        .set {
          background: #59E878;
          box-shadow: 0px 1px 0px 0px #339548, 0px -1px 0px 0px #88FFA2;
          color: white;
        }

        .unlink {
          background: #E2564D;
          box-shadow: 0px 1px 0px 0px #A1443E, 0px -1px 0px 0px #FF8D86;
          color: white;
        }
      `}</style>
    </>
  )
}

export default UserAffiliateModal