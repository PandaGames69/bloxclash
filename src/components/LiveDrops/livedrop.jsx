import Avatar from "../Level/avatar";
import LiveDot from "./livedot";
import LiveItem from "./liveitem";
import {A} from "@solidjs/router";

function LiveDrop(props) {
    return (
        <>
            <div class={'live-drop-container ' + (props?.top ? 'gold' : '')}>
                <div class='live-drop-header'>
                    <div class='type'>
                        <LiveDot type={props?.top ? 'gold' : 'green'}/>
                    </div>

                    <div class='avatar'>
                        <Avatar height='25' id={props?.user?.id} xp={props?.user?.xp}/>
                    </div>

                    <button class='view'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="8" viewBox="0 0 13 8" fill={props?.top ? 'var(--gold)' : '#ADA3EF'}>
                            <path d="M6.5 0C4.01621 0 1.76378 1.3589 0.101718 3.56612C-0.0339061 3.74696 -0.0339061 3.99959 0.101718 4.18042C1.76378 6.3903 4.01621 7.74921 6.5 7.74921C8.98379 7.74921 11.2362 6.3903 12.8983 4.18308C13.0339 4.00225 13.0339 3.74962 12.8983 3.56878C11.2362 1.3589 8.98379 0 6.5 0ZM6.67817 6.60305C5.02941 6.70676 3.66784 5.34786 3.77156 3.69643C3.85665 2.33487 4.96026 1.23126 6.32183 1.14616C7.97059 1.04245 9.33216 2.40135 9.22844 4.05278C9.14069 5.41168 8.03708 6.51529 6.67817 6.60305ZM6.59573 5.34254C5.70753 5.39838 4.97356 4.66708 5.03206 3.77887C5.07727 3.0449 5.67296 2.45188 6.40692 2.40401C7.29513 2.34816 8.0291 3.07947 7.97059 3.96768C7.92273 4.70431 7.32704 5.29733 6.59573 5.34254Z"/>
                        </svg>
                        <A href={`/cases/${props?.case?.slug}`} class='gamemode-link'/>
                    </button>
                </div>

                <div class='details'>
                    <div class='case'>
                        <img src={`${import.meta.env.VITE_SERVER_URL}${props?.case?.img}`} height='40' alt=''/>
                    </div>

                    <LiveItem {...props?.item}/>
                </div>

                <div class='cost'>
                    <img src='/assets/icons/coin.svg' height='15'/>
                    {props?.item?.price?.toLocaleString() || '0'}
                </div>
            </div>

            <style jsx>{`
              .live-drop-container {
                width: 170px;
                min-width: 170px;
                height: 140px;
                
                position: relative;
                z-index: 0;

                border-radius: 10px;
                background: rgba(0, 0, 0, 0.21);
              }
              
              .gold.live-drop-container {
                background: linear-gradient(rgba(177, 120, 24, 1), rgba(156, 99, 15, 1), rgba(126, 80, 12, 1), rgba(102, 65, 10, 1), rgba(177, 120, 24, 1), rgba(255, 220, 24, 1), rgba(255, 220, 24, 1));
              }
              
              .gold.live-drop-container:before {
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
              
              .live-drop-header {
                width: 100%;
                height: fit-content;
                display: flex;
                justify-content: space-between;
              }
              
              .type {
                width: 30px;
                height: 30px;

                border-radius: 10px 0px 8px 0px;
                background: rgba(142, 130, 255, 0.08);
                
                display: flex;
                align-items: center;
                justify-content: center;
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
              
              .case {
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

export default LiveDrop;
