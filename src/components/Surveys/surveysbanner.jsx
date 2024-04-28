import {A} from "@solidjs/router";

function SurveysBanner(props) {
    return (
        <>
            <div class='surveys-banner'>
                <img src='/assets/art/robloxguy.png' width='125' height='207' alt='' class='roblox'/>
                <img src='/assets/icons/coin.svg' height='62' width='67' class='coin one'/>
                <img src='/assets/icons/coinreverse.png' height='57' width='63' class='coin two'/>
                <img src='/assets/icons/coin3.png' height='66' width='61' class='coin three'/>
                <img src='/assets/art/mascot.png' width='186' height='186' class='mascot' alt=''/>

                <div class='providers'>
                    <img src='/assets/walls/adgate.png' height='16' alt=''/>
                    <img src='/assets/walls/offertoro.png' height='16' alt=''/>
                    <img src='/assets/walls/adscend.png' height='16' alt=''/>
                    <img src='/assets/walls/lootably.png' height='16' alt=''/>
                    <img src='/assets/walls/adgem.png' height='16' alt=''/>
                </div>

                <h2 class='white title'>
                    Don’t Have Robux? Don’t Worry, <span class='gold'>We Got you.</span> Make <span className='gold'>Free Robux</span> With Our Survey Providers.
                </h2>

                <button class='bevel-purple start'>
                    GET STARTED {props?.below ? 'BELOW' : 'NOW'}
                    <A href='/surveys' class='gamemode-link'></A>
                </button>
            </div>

            <style jsx>{`
              .surveys-banner {
                width: 100%;
                margin: 50px 0px;
                min-height: 200px;

                border-radius: 15px;
                border: 1px solid rgba(0, 0, 0, 0.00);
                background: url("/assets/art/surveysbg.png"), radial-gradient(68.56% 68.56% at 50% 84.54%, rgba(142, 115, 255, 0.31) 0%, rgba(0, 0, 0, 0.00) 100%), rgba(29, 24, 62, 0.15);
                background-size: cover;
                border-bottom: 1px solid var(--gold);
                
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 25px;
                
                padding: 30px 16px;
                position: relative;
              }
              
              .roblox {
                position: absolute;
                left: -20px;
              }
              
              .coin {
                position: absolute;
              }
              
              .coin.one {
                left: 120px;
                bottom: 33px;
              }

              .coin.two {
                left: 170px;
                top: 30px;
              }

              .coin.three {
                left: 230px;
                bottom: 40px;
              }
              
              .mascot {
                position: absolute;
                right: -10px;
                bottom: 0;
                transform: scaleX(-1);
                z-index: 1;
              }
              
              .title {
                max-width: 560px;
                width: 100%;

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 26px;
                font-weight: 700;
                
                text-align: center;
                margin: unset;
                
                position: relative;
                z-index: 2;
              }
              
              .start {
                color: #FFF;
                font-size: 16px;
                font-weight: 700;
                
                width: 100%;
                max-width: 200px;
                min-height: 46px;
                
                position: relative;
              }
              
              .providers {
                display: flex;
                flex-direction: column;
                gap: 12px;

                border-radius: 0px 0px 15px 15px;
                background: linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), radial-gradient(60% 60% at 50% 50%, rgba(147, 126, 236, 0.50) 0%, rgba(102, 83, 184, 0.50) 100%);
                
                position: absolute;
                right: 130px;
                top: 0;
                z-index: 0;
                
                padding: 8px 30px;
              }

              @media only screen and (max-width: 1040px) {
                .providers, .coin {
                  display: none;
                }
              }

              @media only screen and (max-width: 850px) {
                .mascot, .roblox {
                  display: none;
                }
              }
            `}</style>
        </>
    );
}

export default SurveysBanner;
