import {getCents} from "../../util/balance";

function RainEnd(props) {

    return (
        <>
            <div class='rainend-container'>
                <div class='swords'/>
                <p class='title'><img src='/assets/icons/coin.svg'/>RAIN HAS ENDED</p>
                <p class='info'><span class='gold'>{props?.content?.users}</span> users successfully claimed the rain</p>

                <div class='amount-backing'>
                    <div class='amount-container'>
                        <img class='coin' src='/assets/icons/fancycoin.png' alt='' height='40'/>
                        <p>{Math.floor(props?.content?.total || 0)}<span class='cents'>.{getCents(props?.content?.total || 0)}</span></p>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .rainend-container {
                width: 100%;
                height: 100px;
                min-height: 100px;

                background: conic-gradient(from 180deg at 50% 50%, #FFDC18 -0.3deg, #B17818 72.1deg, rgba(156, 99, 15, 0.611382) 139.9deg, rgba(126, 80, 12, 0.492874) 180.52deg, rgba(102, 65, 10, 0.61) 215.31deg, #B17818 288.37deg, #FFDC18 359.62deg, #FFDC18 359.7deg, #B17818 432.1deg),
                linear-gradient(0deg, #2A2453, #2A2453);
                border-radius: 8px;
                
                position: relative;
                z-index: 0;
                
                padding: 15px 20px;
                overflow: visible;
              }
              
              .rainend-container > * {
                position: relative;
                z-index: 2;
              }
              
              .rainend-container:before {
                width: calc(100% - 2px);
                height: calc(100% - 2px);
                
                top: 1px;
                left: 1px;
                position: absolute;
                z-index: 1;
                content: '';

                background: linear-gradient(0deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)), radial-gradient(196.93% 1543.75% at 129.21% -19.16%, rgba(252, 163, 30, 0.15) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(277.39deg, rgba(19, 17, 41, 0.8) -69.8%, rgba(37, 31, 78, 0.8) 144.89%);
                border-radius: 8px;
              }

              .rainend-container:after {
                width: calc(100% - 2px);
                height: calc(100% - 2px);

                top: 1px;
                left: 1px;
                position: absolute;
                z-index: 0;
                content: '';

                background-color: #2A2453;
                border-radius: 8px;
              }
              
              .swords {
                width: calc(100% - 2px);
                height: calc(100% - 2px);

                top: 1px;
                left: 1px;
                position: absolute !important;
                z-index: 0;

                opacity: 0.1;
                background-image: url("/assets/art/rainswords.png");
                background-position: center;
                background-size: cover;
                border-radius: 8px;
              }
              
              .title {
                display: flex;
                gap: 5px;

                font-family: 'Geogrotesque Wide';
                font-weight: 700;
                font-size: 14px;
                
                background: linear-gradient(53.13deg, #FF9900 54.58%, #F9AC39 69.11%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-fill-color: transparent;
              }
              
              .info {
                font-family: 'Geogrotesque Wide';
                font-weight: 700;
                font-size: 12px;
                
                color: white;
                
                margin: 5px 0 0 0;
              }
              
              .amount-backing {
                width: 100%;
                height: 35px;
                
                position: absolute !important;
                left: -1px;
                bottom: 0;

                background: linear-gradient(270deg, rgba(90, 84, 153, 0) 0%, rgba(249, 172, 57, 0.31) 98.73%, rgba(90, 84, 153, 0) 100%);
                border-radius: 0 0 8px 8px;
                
                display: flex;
                align-items: center;
                justify-content: center;
                
                padding: 0 5px;

                overflow: visible;
              }
              
              .amount-container {
                width: 100%;
                height: 24px;

                background: conic-gradient(from 180deg at 50% 50%, #FFDC18 -0.3deg, #B17818 72.1deg, rgba(156, 99, 15, 0.611382) 139.9deg, rgba(126, 80, 12, 0.492874) 180.52deg, rgba(102, 65, 10, 0.61) 215.31deg, #B17818 288.37deg, #FFDC18 359.62deg, #FFDC18 359.7deg, #B17818 432.1deg);
                border-radius: 5px;
                
                position: relative;
                
                display: flex;
                align-items: center;
                justify-content: center;

                font-family: 'Geogrotesque Wide';
                font-weight: 700;
                color: white;
                font-size: 13px;
                
                overflow: visible;
              }
              
              .amount-container:before {
                width: calc(100% - 2px);
                height: calc(100% - 2px);

                top: 1px;
                left: 1px;
                position: absolute;
                z-index: 1;
                content: '';

                background: #534141;
                border-radius: 5px;
              }
              
              .amount-container > * {
                position: relative;
                z-index: 1;
              }
              
              .coin {
                position: absolute !important;
                left: -15px;
                z-index: 1;
              }
              
              .cents {
                color: #A7A7A7;
              }
            `}</style>
        </>
    );
}

export default RainEnd;
