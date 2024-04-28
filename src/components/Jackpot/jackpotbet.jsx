import CoinflipItem from "../Coinflips/coinflipitem";
import Avatar from "../Level/avatar";
import {getCents} from "../../util/balance";

function JackpotBet(props) {

    function getRarity(price) {
        if (price < 1000) {
            return 'gray'
        } else if (price < 10000) {
            return 'blue'
        } else if (price < 50000) {
            return 'pink'
        } else if (price < 250000) {
            return 'red'
        }
        return 'gold'
    }

    function getImage() {
        if (props?.img) return `${import.meta.env.VITE_SERVER_URL}${props.img}`
        return '/assets/icons/coin.svg'
    }

    return (
        <>
            <div class={'jp-bet ' + (getRarity(props?.amount || 0))}>
                <div class='item'>
                    <CoinflipItem price={props?.amount}/>
                    <p>ROBUX COIN STACK</p>
                </div>

                <p class='cost'>
                    <img src='/assets/icons/coin.svg' height='16' width='16' alt=''/>
                    <span>
                        {props?.amount?.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}.<span class='cents'>{getCents(props?.amount)}</span>
                    </span>
                </p>

                <div class='user'>
                    <Avatar id={props?.user?.id} xp={props?.user?.xp} height='45'/>
                    <p>{props?.user?.username || 'Anonymous'}</p>
                </div>
            </div>

            <style jsx>{`
              .jp-bet {
                height: 85px;
                min-height: 85px;
                
                flex: 1;
                
                position: relative;
                display: flex;
                align-items: center;
                
                border-radius: 10px;
                z-index: 0;
                
                padding: 0 20px;
              }
              
              .jp-bet > * {
                flex: 1 1 0;
              }
              
              .cost {
                flex: unset !important;
                min-width: 125px;
                height: 30px;
              }
              
              .user {
                display: flex;
                align-items: center;
                gap: 12px;
                justify-content: flex-end;

                color: #ADA3EF;
                font-size: 14px;
                font-weight: 700;
              }
              
              .item {
                display: flex;
                align-items: center;
                gap: 12px;

                color: var(--gold);
                font-size: 13px;
                font-weight: 600;
              }
              
              .gray {
                background: linear-gradient(to right, rgba(169, 181, 210, 0.05), rgba(169, 181, 210, 0.05) 100%), rgba(0, 0, 0, 0.20);
                border: 1px dashed #A9C9D2;
              }

              .blue {
                background: linear-gradient(to right, rgba(65, 118, 255, 0.05), rgba(65, 118, 255, 0.05) 100%), rgba(0, 0, 0, 0.20);
                border: 1px dashed #4176FF;
              }

              .pink {
                background: linear-gradient(to right, rgba(220, 95, 222, 0.05), rgba(220, 95, 222, 0.05) 100%), rgba(0, 0, 0, 0.20);
                border: 1px dashed #DB5FDD;
              }

              .red {
                background: linear-gradient(to right, rgba(255, 81, 65, 0.05), rgba(255, 81, 65, 0.05) 100%), rgba(0, 0, 0, 0.20);
                border: 1px dashed #FF5141;
              }

              .gold {
                background: linear-gradient(to right, rgba(255, 153, 1, 0.05), rgba(255, 153, 1, 0.05) 100%), rgba(0, 0, 0, 0.20);
                border: 1px dashed #FCA31E;
              }
              
              .cents {
                color: #A7A7A7;
              }
            `}</style>
        </>
    );
}

export default JackpotBet;
