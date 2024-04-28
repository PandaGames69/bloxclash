import Avatar from "../Level/avatar";
import Level from "../Level/level";
import Switch from "../Toggle/switch";
import {authedAPI, createNotification} from "../../util/api";
import {createEffect, createSignal, Show} from "solid-js";
import Loader from "../Loader/loader";
import {getUserLevel, levelToXP} from "../../resources/levels";

function AdminUserModal(props) {

  createEffect(() => {
    if (!props?.user?.id) return

    setBanned(props?.user?.banned)
    setRainBan(props?.user?.rainBan)
    setTipBan(props?.user?.tipBan)
    setLeaderboardBan(props?.user?.leaderboardBan)
    setLockAccount(props?.user?.accountLock)
    setSponsorLock(props?.user?.sponsorLock)
    setRank(props?.user?.role)
    setSeconds(props?.user?.muteSeconds)
    setBalance(props?.user?.balance || 0)
    setMaxRain(props?.user?.rainTipAllowance)
    setMaxTip(props?.user?.tipAllowance)
    setMaxPerTip(props?.user?.maxPerTip)
    setMaxTipPerUser(props?.user?.maxTipPerUser)
    setCryptoAllowance(props?.user?.cryptoAllowance)
    setLevel(getUserLevel(props?.user?.xp))
    setDiscord(props?.user?.discordId)
  }, [props?.user])

  const [banned, setBanned] = createSignal(false)
  const [rainBan, setRainBan] = createSignal(false)
  const [tipBan, setTipBan] = createSignal(false)
  const [leaderboardBan, setLeaderboardBan] = createSignal(false)
  const [lockAccount, setLockAccount] = createSignal(false)
  const [sponsorLock, setSponsorLock] = createSignal(false)
  const [seconds, setSeconds] = createSignal(0)
  const [balance, setBalance] = createSignal(0)
  const [maxRain, setMaxRain] = createSignal(0)
  const [maxTip, setMaxTip] = createSignal(0)
  const [maxPerTip, setMaxPerTip] = createSignal(0)
  const [maxTipPerUser, setMaxTipPerUser] = createSignal(0)
  const [cryptoAllowance, setCryptoAllowance] = createSignal(0)
  const [level, setLevel] = createSignal(0)
  const [rank, setRank] = createSignal('USER')
  const [discord, setDiscord] = createSignal(null)

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
                      <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                      {(props?.user?.wagered || 0)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p>TOTAL WAGERED</p>
                  </div>

                  <div className='stat'>
                    <p className='white align'>
                      <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                      {(props?.user?.withdraws || 0)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p>WITHDRAWN</p>
                  </div>

                  <div className='stat'>
                    <p className='white align'>
                      <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                      {(props?.user?.deposits || 0)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p>DEPOSITED</p>
                  </div>

                  <div className='stat green'>
                    <p className='white align'>
                      <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                      {((props?.user?.withdraws - props?.user?.deposits) || 0)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <p className='green'>TOTAL PROFIT</p>
                  </div>
                </div>

                <div className='bar' style={{margin: '25px 0 35px 0'}}/>

                <div className='settings'>
                  <div className='table-data'>
                    <div className='table-column'>
                      <p>BANNED</p>
                    </div>

                    <div className='table-column'>
                      <Switch dark={true} active={banned()} toggle={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          banned: !banned()
                        }), true)

                        if (res.success) {
                          setBanned(!banned())
                          createNotification('success', `Successfully ${banned() ? '' : 'un'}banned ` + props?.user?.username)
                        }
                      }}/>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>RAIN BAN</p>
                    </div>

                    <div className='table-column'>
                      <Switch dark={true} active={rainBan()} toggle={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          rainBan: !rainBan()
                        }), true)

                        if (res.success) {
                          setRainBan(!rainBan())
                          createNotification('success', `Successfully rain ${rainBan() ? '' : 'un'}banned ` + props?.user?.username)
                        }
                      }}/>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>TIP BAN</p>
                    </div>

                    <div className='table-column'>
                      <Switch dark={true} active={tipBan()} toggle={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          tipBan: !tipBan()
                        }), true)

                        if (res.success) {
                          setTipBan(!tipBan())
                          createNotification('success', `Successfully tip ${tipBan() ? '' : 'un'}banned ` + props?.user?.username)
                        }
                      }}/>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>LEADERBOARD BAN</p>
                    </div>

                    <div className='table-column'>
                      <Switch dark={true} active={leaderboardBan()} toggle={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          leaderboardBan: !leaderboardBan()
                        }), true)

                        if (res.success) {
                          setLeaderboardBan(!leaderboardBan())
                          createNotification('success', `Successfully rain ${leaderboardBan() ? '' : 'un'}banned ` + props?.user?.username)
                        }
                      }}/>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>LOCK ACCOUNT</p>
                    </div>

                    <div className='table-column'>
                      <Switch dark={true} active={lockAccount()} toggle={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          accountLock: !lockAccount()
                        }), true)

                        if (res.success) {
                          setLockAccount(!lockAccount())
                          createNotification('success', `Successfully ${lockAccount() ? '' : 'un'}locked ` + props?.user?.username)
                        }
                      }}/>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>SPONSOR LOCK</p>
                    </div>

                    <div className='table-column'>
                      <Switch dark={true} active={sponsorLock()} toggle={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          sponsorLock: !sponsorLock()
                        }), true)

                        if (res.success) {
                          setSponsorLock(!sponsorLock())
                          createNotification('success', `Successfully sponsor ${sponsorLock() ? '' : 'un'}locked ` + props?.user?.username)
                        }
                      }}/>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>MUTE USER</p>
                    </div>

                    <div className='table-column'>
                      <div class='input-wrapper'>
                        <div class='input-label'>SECONDS</div>
                        <input class='input gold' type='number' placeholder='0' value={seconds()}
                               onInput={(e) => setSeconds(e.target.valueAsNumber)}/>
                      </div>

                      <button class='bevel-light update' onClick={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          muteSeconds: isNaN(seconds()) ? null : seconds()
                        }), true)

                        if (res.success) {
                          createNotification('success', `Successfully muted ${props?.user?.username}'s for ${seconds()} seconds.`)
                        }
                      }}>UPDATE
                      </button>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>SET BALANCE</p>
                    </div>

                    <div className='table-column'>
                      <div className='input-wrapper'>
                        <img src='/assets/icons/coin.svg' height='16' width='16' alt=''/>
                        <input class='input' type='number' placeholder='0' value={balance()}
                               onInput={(e) => setBalance(e.target.valueAsNumber)}/>
                      </div>

                      <button className='bevel-light update' onClick={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          balance: balance()
                        }), true)

                        if (res.success) {
                          createNotification('success', `Successfully set ${props?.user?.username}'s balance to ${balance()}`)
                        }
                      }}>UPDATE
                      </button>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>SELECT RANK</p>
                    </div>

                    <div className='table-column'>
                      <div className='input-wrapper'>
                        <div className='input-label'>RANK</div>
                        <select class='input' value={rank()} onInput={(e) => setRank(e.target.value)}>
                          <option value='OWNER'>OWNER</option>
                          <option value='DEV'>DEV</option>
                          <option value='ADMIN'>ADMIN</option>
                          <option value='MOD'>MOD</option>
                          <option value='USER'>USER</option>
                          <option value='BOT'>BOT</option>
                        </select>
                      </div>

                      <button className='bevel-light update' onClick={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          role: rank()
                        }), true)

                        if (res.success) {
                          createNotification('success', `Successfully set ${props?.user?.username}'s role to ${rank()}`)
                        }
                      }}>UPDATE
                      </button>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>SET MAX PER TIP</p>
                    </div>

                    <div className='table-column'>
                      <div className='input-wrapper'>
                        <img src='/assets/icons/coin.svg' height='16' width='16' alt=''/>
                        <input className='input' type='number' placeholder='0' value={maxPerTip()}
                               onInput={(e) => setMaxPerTip(e.target.valueAsNumber)}/>
                      </div>

                      <button className='bevel-light update' onClick={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          maxPerTip: isNaN(maxPerTip()) ? null : maxPerTip()
                        }), true)

                        if (res.success) {
                          createNotification('success', `Successfully set ${props?.user?.username}'s max per tip to ${maxPerTip()}`)
                        }
                      }}>UPDATE
                      </button>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>SET MAX TIP PER USER</p>
                    </div>

                    <div className='table-column'>
                      <div className='input-wrapper'>
                        <img src='/assets/icons/coin.svg' height='16' width='16' alt=''/>
                        <input className='input' type='number' placeholder='0' value={maxTipPerUser()}
                               onInput={(e) => setMaxTipPerUser(e.target.valueAsNumber)}/>
                      </div>

                      <button className='bevel-light update' onClick={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          maxTipPerUser: isNaN(maxTipPerUser()) ? null : maxTipPerUser()
                        }), true)

                        if (res.success) {
                          createNotification('success', `Successfully set ${props?.user?.username}'s max tip per user to ${maxTipPerUser()}`)
                        }
                      }}>UPDATE
                      </button>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>SET TIP ALLOWANCE</p>
                    </div>

                    <div className='table-column'>
                      <div className='input-wrapper'>
                        <img src='/assets/icons/coin.svg' height='16' width='16' alt=''/>
                        <input className='input' type='number' placeholder='0' value={maxTip()}
                               onInput={(e) => setMaxTip(e.target.valueAsNumber)}/>
                      </div>

                      <button className='bevel-light update' onClick={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          tipAllowance: isNaN(maxTip()) ? null : maxTip()
                        }), true)

                        if (res.success) {
                          createNotification('success', `Successfully set ${props?.user?.username}'s tip allowance to ${maxTip()}`)
                        }
                      }}>UPDATE
                      </button>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>SET RAIN TIP ALLOWANCE</p>
                    </div>

                    <div className='table-column'>
                      <div className='input-wrapper'>
                        <img src='/assets/icons/coin.svg' height='16' width='16' alt=''/>
                        <input className='input' type='number' placeholder='0' value={maxRain()}
                               onInput={(e) => setMaxRain(e.target.valueAsNumber)}/>
                      </div>

                      <button className='bevel-light update' onClick={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          rainTipAllowance: isNaN(maxRain()) ? null : maxRain()
                        }), true)

                        if (res.success) {
                          createNotification('success', `Successfully set ${props?.user?.username}'s rain tip allowance to ${maxRain()}`)
                        }
                      }}>UPDATE
                      </button>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>SET CRYPTO ALLOWANCE</p>
                    </div>

                    <div className='table-column'>
                      <div className='input-wrapper'>
                        <img src='/assets/icons/coin.svg' height='16' width='16' alt=''/>
                        <input className='input' type='number' placeholder='0' value={cryptoAllowance()}
                               onInput={(e) => setCryptoAllowance(e.target.valueAsNumber)}/>
                      </div>

                      <button className='bevel-light update' onClick={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          cryptoAllowance: isNaN(cryptoAllowance()) ? null : cryptoAllowance()
                        }), true)

                        if (res.success) {
                          createNotification('success', `Successfully set ${props?.user?.username}'s crypto allowance allowance to ${maxRain()}`)
                        }
                      }}>UPDATE
                      </button>
                    </div>
                  </div>

                  <div className='table-data'>
                    <div className='table-column'>
                      <p>SET USER LEVEL</p>
                    </div>

                    <div className='table-column'>
                      <div className='input-wrapper'>
                        <div className='input-label'>LEVEL</div>
                        <input className='input gold' type='number' placeholder='0' value={level()}
                               onInput={(e) => setLevel(e.target.valueAsNumber)}/>
                      </div>

                      <button className='set' onClick={async () => {
                        let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                          xp: levelToXP(level())
                        }), true)

                        if (res.success) {
                          createNotification('success', `Successfully set ${props?.user?.username}'s level to ${level()}`)
                        }
                      }}>SET
                      </button>
                    </div>
                  </div>

                  {discord() && (
                    <div className='table-data'>
                      <div className='table-column'>
                        <p>UNLINK DISCORD</p>
                      </div>

                      <div className='table-column'>
                        <button className='unlink' onClick={async () => {
                          let res = await authedAPI(`/admin/users/${props?.user?.id}`, 'POST', JSON.stringify({
                            unlinkDiscord: true
                          }), true)

                          if (res.success) {
                            setDiscord(null)
                            createNotification('success', `Successfully unlinked ${props?.user?.username}'s discord.`)
                          }
                        }}>UNLINK
                        </button>
                      </div>
                    </div>
                  )}
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

export default AdminUserModal