import Avatar from "../Level/avatar";
import LiveDot from "./livedot";
import {formatNumber} from "../../util/numbers";

function LiveEarn(props) {
    return (
        <>
            <div class={'live-earn-container ' + (props?.top ? 'gold' : '')}>
                <div class='live-earn-header'>
                    <div class='type'>
                        <LiveDot type={props?.top ? 'gold' : 'green'}/>
                    </div>

                    <div class='avatar'>
                        <Avatar height='25' id={props?.user?.id} xp={props?.user?.xp}/>
                    </div>
                </div>

                <div class='details'>
                    <div class='wall'>
                        <img src={`${import.meta.env.VITE_SERVER_URL}/public/walls/${props?.provider}.png`} height='30' alt=''/>
                    </div>
                </div>

                <div class='cost'>
                    <img src='/assets/icons/coin.svg' height='15'/>
                    {formatNumber(props?.robux)}
                </div>
            </div>

            <style jsx>{`
              .live-earn-container {
                width: 170px;
                min-width: 170px;
                height: 140px;
                
                position: relative;
                z-index: 0;

                border-radius: 10px;
                background: rgba(0, 0, 0, 0.21);
              }
              
              .gold.live-earn-container {
                background: linear-gradient(rgba(177, 120, 24, 1), rgba(156, 99, 15, 1), rgba(126, 80, 12, 1), rgba(102, 65, 10, 1), rgba(177, 120, 24, 1), rgba(255, 220, 24, 1), rgba(255, 220, 24, 1));
              }
              
              .gold.live-earn-container:before {
                z-index: -1;
                content: '';
                position: absolute;
                width: 168px;
                height: 138px;
                top: 1px;
                left: 1px;
                border-radius: 10px;
                background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(252, 164, 33, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), rgba(41, 38, 77, 1);
              }
              
              .live-earn-header {
                width: 100%;
                height: fit-content;
                display: flex;
                justify-content: center;
                position: relative;
              }
              
              .type {
                width: 30px;
                height: 30px;

                border-radius: 10px 0px 8px 0px;
                background: rgba(142, 130, 255, 0.08);
                
                display: flex;
                align-items: center;
                justify-content: center;
                
                position: absolute;
                left: 0;
                top: 0;
              }
              
              .view {
                width: 30px;
                height: 30px;
                
                border: unset;
                outline: unset;
                
                border-radius: 0px 10px 0px 8px;
                background: rgba(142, 130, 255, 0.08);

                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                
                position: relative;
              }
              
              .gold .view, .gold .type {
                background: linear-gradient(37deg, rgba(255, 153, 0, 0.15) 30.03%, rgba(249, 172, 57, 0.15) 42.84%);
              }
              
              .avatar {
                margin-top: 8px;
              }
              
              .details {
                display: flex;
                padding: 10px 8px;
                gap: 8px;
              }
              
              .wall {
                flex: 1;
                height: 55px;
                
                display: flex;
                align-items: center;
                justify-content: center;

                border-radius: 10px;
                border: 1px solid #2D2C59;
                background: rgba(0, 0, 0, 0.21);
              }

              .cost {
                height: 26px;
                gap: 10px;
                margin: 0 8px;
              }
            `}</style>
        </>
    );
}

export default LiveEarn;
