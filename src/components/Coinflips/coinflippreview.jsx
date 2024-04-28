import {getCents} from "../../util/balance";
import Avatar from "../Level/avatar";
import CoinflipItem from "./coinflipitem";
import {authedAPI} from "../../util/api";
import ActiveGame from "../Loader/activegame";

function CoinflipPreview(props) {

    const creator = props?.flip[props?.flip?.ownerSide]

    return (
        <>
            <div class='coinflip-preview-container'>
                <div class='user'>
                    <img src={`/assets/icons/${props?.flip?.ownerSide}coin.svg`} height='35' width='35' alt={props?.flip?.ownerSide}/>

                    <Avatar id={creator?.id} xp={creator?.xp} height='45'/>
                    <p class='username'>{creator?.username}</p>
                </div>

                <div class='items'>
                    <CoinflipItem price={props?.flip?.amount}/>
                </div>

                <div class='cost'>
                    <img class='coin' src='/assets/icons/coin.svg' height='15'/>
                    <p>{Math.floor(props?.flip?.amount)?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}<span
                        class='gray'>.{getCents(props?.flip?.amount)}</span></p>
                </div>

                <div class='controls'>
                    {(!props?.flip?.fire || !props?.flip?.ice) && creator?.id !== props?.user?.id && (
                        <button class='bevel-gold join' onClick={async () => {
                            let res = await authedAPI(`/coinflip/${props?.flip?.id}/join`, 'POST', null, true)
                            if (res.success) {
                                props?.click()
                            }
                        }}>JOIN</button>
                    )}

                    {(props?.flip?.startedAt && props?.time < props?.flip?.endsAt) && (
                      <ActiveGame/>
                    )}

                    {props?.time >= props?.flip?.endsAt && (
                      <div class={'winner ' + props?.flip?.winnerSide}>
                          <img src={`/assets/icons/${props?.flip?.winnerSide}coin.svg`} height='18' width='18' alt={props?.flip?.winnerSide}/>
                          <p>WINNER</p>
                      </div>
                    )}

                    <button class='bevel-light view' onClick={props.click}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="8" viewBox="0 0 13 8"
                             fill='#ADA3EF'>
                            <path
                                d="M6.5 0C4.01621 0 1.76378 1.3589 0.101718 3.56612C-0.0339061 3.74696 -0.0339061 3.99959 0.101718 4.18042C1.76378 6.3903 4.01621 7.74921 6.5 7.74921C8.98379 7.74921 11.2362 6.3903 12.8983 4.18308C13.0339 4.00225 13.0339 3.74962 12.8983 3.56878C11.2362 1.3589 8.98379 0 6.5 0ZM6.67817 6.60305C5.02941 6.70676 3.66784 5.34786 3.77156 3.69643C3.85665 2.33487 4.96026 1.23126 6.32183 1.14616C7.97059 1.04245 9.33216 2.40135 9.22844 4.05278C9.14069 5.41168 8.03708 6.51529 6.67817 6.60305ZM6.59573 5.34254C5.70753 5.39838 4.97356 4.66708 5.03206 3.77887C5.07727 3.0449 5.67296 2.45188 6.40692 2.40401C7.29513 2.34816 8.0291 3.07947 7.97059 3.96768C7.92273 4.70431 7.32704 5.29733 6.59573 5.34254Z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <style jsx>{`
              .coinflip-preview-container {
                width: 100%;
                height: 90px;

                display: flex;
                align-items: center;
                gap: 30px;
                padding: 0 20px;

                position: relative;

                background: rgba(90, 84, 153, 0.27);
              }
              
              .coinflip-preview-container:nth-child(2n) {
                background: rgba(90, 84, 153, 0.15);
              }
              
              .user {
                display: flex;
                align-items: center;
                gap: 15px;
                
                width: 100%;
                max-width: 185px;

                color: #ADA3EF;
                font-size: 14px;
                font-weight: 700;
                
                overflow: hidden;
              }
              
              .username {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .cost {
                height: 30px;
                padding: 0 10px;
                margin-left: auto;
              }
              
              .controls {
                display: flex;
                max-width: 175px;
                width: 100%;
                gap: 8px;
                justify-content: flex-end;
                align-items: center;
              }
              
              .winner {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  
                  padding: 0 6px;
                  border-radius: 3px;
                  height: 30px;
                  
                  font-size: 13px;
                  font-weight: 600;
              }
              
              .winner p {
                  margin-top: -2px;
              }
              
              .winner.ice {
                  color: #4171EC;
                  border: 1px solid #1E4DD1;
                  background: rgba(30, 77, 209, 0.15);
              }
              
              .winner.fire {
                  color: #EC4B45;
                  border: 1px solid #DE362F;
                  background: rgba(222, 54, 47, 0.15);
              }

              .join {
                height: 30px;
                width: 75px;
              }

              .view {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 30px;
                width: 30px;
                position: relative;
              }

              @media only screen and (max-width: 700px) {
                //.user {
                //  flex-direction: column;
                //}
                
                .coinflip-preview-container {
                  gap: 10px;
                  padding: 0 7px;
                }
                
                .controls {
                  max-width: unset;
                  width: fit-content;
                }
                
                .items {
                  display: none;
                }
                
                .join {
                  width: 45px;
                  height: 22px;
                  font-size: 10px;
                }
                
                .view {
                  width: 22px;
                  height: 22px;
                }
                
                .cost {
                  font-size: 10px;
                  height: 22px;
                  padding: 0 6px;
                }
                
                .coin {
                  height: 11px;
                  width: 11px;
                }
              }
            `}</style>
        </>
    );
}

export default CoinflipPreview;
