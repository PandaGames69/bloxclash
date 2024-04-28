import Level from "../Level/level";
import {levelToXP} from "../../resources/levels";
import Avatar from "../Level/avatar";
import {authedAPI} from "../../util/api";

const NotificationTitles = {
  'withdraw-completed': 'Withdraw',
  'deposit-completed': 'Deposit',
  'tip-received': 'Tip',
  'rewards-claimed': 'Rewards',
  'level-up': 'Rewards',
}

function Notification(props) {

  const NotificationContent = {
    'withdraw-completed': () => <div>
      Your withdraw of
      <img src='/assets/icons/coin.svg' height='18' width='19' alt=''/>
      <span class='white bold'>{props?.content?.amount?.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}</span>
      succeeded.
    </div>,

    'deposit-completed': () => <div>
      Your deposit of
      <img src='/assets/icons/coin.svg' height='18' width='19' alt=''/>
      <span className='white bold'>{props?.content?.amount?.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}</span>
      has been credited.
    </div>,

    'tip-received': () => <div class='tip'>
      <Avatar id={props?.content?.fromUser?.id} height='24'/> <p class='white bold'>{props?.content?.fromUser?.username}</p> <Level xp={props?.content?.fromUser?.xp}/>
      tipped you &nbsp;
      <span class='fancyamt'>
        <img src='/assets/icons/coin.svg' height='18' width='19' alt=''/>
        {props?.content?.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2})}
      </span>
    </div>,

    'reward-claimed': () => <div>
      <span class='gold'>You claimed: </span>
      <div class='flex'>
        <span className='fancyamt'>
          <img src='/assets/icons/coin.svg' height='18' width='19' alt=''/>
          {props?.content?.amount?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </span> from your rewards.
      </div>
    </div>,

    'level-up': () => <p class='gold'>Congrats, you leveled up! <Level xp={levelToXP(props?.content?.level)}/></p>,
  }

  return (
    <>
      <div className='notification'>
        <p class='title'>
          <img src='/assets/icons/bell.svg' height='15' width='12' alt=''/>
          {NotificationTitles[props?.type]}
        </p>

        <button class='trash' onClick={async () => {
          let res = await authedAPI(`/user/notifications/${props?.id}`, 'DELETE', null, true)

          if (res.success) {
            props?.delete()
          }
        }}>
          <img src='/assets/icons/trash.svg' height='13' width='12' alt=''/>
        </button>

        <div class='content'>
          {NotificationContent[props?.type]}
        </div>
      </div>

      <style jsx>{`
        .notification {
          width: 100%;
          height: fit-content;

          border-radius: 3px;
          border: 1px solid #3A326F;
          background: rgba(49, 42, 94, 0.50);

          display: flex;
          flex-direction: column;

          font-family: Geogrotesque Wide, sans-serif;
          font-size: 15px;
          font-weight: 500;

          position: relative;
        }

        .title {
          height: 25px;
          width: fit-content;
          padding: 0 12px;

          border-radius: 3px 0px;
          background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%), #312A5E;

          color: #FFF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 15px;
          font-weight: 600;

          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .trash {
          height: 25px;
          width: 36px;
          
          background: #3E3570;
          border-radius: 24px;
          
          outline: unset;
          border: unset;
          
          position: absolute;
          top: 4px;
          right: 8px;
          cursor: pointer;
        }

        .content {
          padding: 12px;
          color: rgba(154, 144, 209, 0.75);
        }

        .content > div, .content > p {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;

          cursor: initial;
          align-items: center;
        }

        .gold {
          color: rgba(252, 163, 30, 0.75) !important;
        }

        .fancyamt {
          border-radius: 4px;
          border: 1px solid #866FEA;
          background: radial-gradient(60% 60% at 50% 50%, rgba(147, 126, 236, 0.15) 0%, rgba(102, 83, 184, 0.15) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);
          box-shadow: 0px 0px 35px 0px rgba(180, 22, 255, 0.10), 0px 1px 5px 0px rgba(0, 0, 0, 0.25) inset;

          height: 30px;
          padding: 0 8px;

          color: white;
          text-shadow: 0px 2px 0px #513E82;
          font-weight: 700;

          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .flex {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
        }
      `}</style>
    </>
  );
}

export default Notification
