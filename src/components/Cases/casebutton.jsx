import {A} from "@solidjs/router";
import CaseTitle from "./casetitle";

function CaseButton(props) {
    return (
        <>
            <div class={'case-button ' + (props?.creator ? 'creator' : 'button')}>
                <CaseTitle name={props?.c?.name || 'Unknown'}/>

                <div class='cost'>
                    <img src='/assets/icons/coin.svg' height='13' alt='' loading="lazy"/>
                    <p>{props?.c?.price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0}</p>
                </div>

                <img class='image' src={`${import.meta.env.VITE_SERVER_URL}${props?.c?.img || '/public/cases/radiation-case.png'}`} alt='' height={props?.creator ? '80' : '120'}/>

                {!props.creator && (
                    <A href={`/cases/${props?.c?.slug}`} class='gamemode-link' draggable={false}></A>
                )}

                {props?.creator && props?.amount > 0 && (
                    <div class='controls'>
                        <button class='adder bevel-light' onClick={props?.removeCase}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="3" viewBox="0 0 9 3" fill="none">
                                <path
                                    d="M0.723861 0H8.27614C8.75871 0 9 0.205882 9 0.617647V2.36029C9 2.78676 8.75871 3 8.27614 3H0.723861C0.241287 3 0 2.78676 0 2.36029V0.617647C0 0.205882 0.241287 0 0.723861 0Z"
                                    fill="#ADA3EF"/>
                            </svg>
                        </button>

                        <p>{props?.amount || 0}</p>

                        <button class='adder bevel-light' onClick={props?.addCase}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" fill="none">
                                <path
                                    d="M3.26627 8.41177V5.82353H0.532544C0.177515 5.82353 0 5.63399 0 5.2549V3.7451C0 3.37909 0.177515 3.19608 0.532544 3.19608H3.26627V0.588235C3.26627 0.196078 3.43195 0 3.76331 0H5.20118C5.54438 0 5.71598 0.196078 5.71598 0.588235V3.19608H8.46745C8.82248 3.19608 9 3.37909 9 3.7451V5.2549C9 5.63399 8.82248 5.82353 8.46745 5.82353H5.71598V8.41177C5.71598 8.80392 5.54438 9 5.20118 9H3.76331C3.43195 9 3.26627 8.80392 3.26627 8.41177Z"
                                    fill="#ADA3EF"/>
                            </svg>
                        </button>
                    </div>
                )}

                {props?.creator && !props?.amount && (
                    <div class='controls'>
                        <button class='add bevel-light' onClick={props?.addCase}>
                            Add Case
                        </button>
                    </div>
                )}

                <div class='bg'/>
            </div>

            <style jsx>{`
              .case-button {
                height: 230px;

                border-radius: 10px;
                background: linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.20) 100%), linear-gradient(222deg, rgba(69, 65, 122, 0.65) 0%, rgba(43, 40, 80, 0.00) 100%);
                
                display: flex;
                align-items: center;
                flex-direction: column;

                padding: 10px;
                position: relative;
                overflow: hidden;
              }
              
              .button(.creator) {
                width: unset;
                cursor: pointer;
                padding: 15px;
              }
              
              .image {
                transition: transform .3s;
              }

              .button:hover .image {
                transform: translateY(-3px);
              }
              
              .cost {
                min-width: 120px;
                min-height: 25px;
                padding: 0 15px;
                margin: 10px 0 15px 0;
                
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;

                background: conic-gradient(from 180deg at 50% 50%, #FFDC18 -0.3deg, #B17818 72.1deg, rgba(156, 99, 15, 0.611382) 139.9deg, rgba(126, 80, 12, 0.492874) 180.52deg, rgba(102, 65, 10, 0.61) 215.31deg, #B17818 288.37deg, #FFDC18 359.62deg, #FFDC18 359.7deg, #B17818 432.1deg);
                border-radius: 3px;
                position: relative;
                z-index: 0;
                
                color: white;
                font-weight: 700;
                font-size: 13px;
              }

              .cost:before {
                position: absolute;
                left: 1px;
                top: 1px;
                z-index: -1;
                content: '';
                
                height: calc(100% - 2px);
                width: calc(100% - 2px);
                border-radius: 3px;
                
                background: linear-gradient(0deg, rgba(255, 190, 24, 0.25), rgba(255, 190, 24, 0.25)), linear-gradient(252.77deg, #1A0E33 -27.53%, #423C7A 175.86%);
              }
              
              .controls {
                display: flex;
                align-items: center;
                gap: 25px;

                color: #FFF;
                font-size: 16px;
                font-weight: 700;
                
                margin-top: auto;
                z-index: 1;
              }
              
              .add {
                width: 108px;
                height: 31px;

                color: #AEA4E4;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 13px;
                font-weight: 700;
              }
              
              .adder {
                width: 30px;
                height: 30px;
                
                display: flex;
                align-items: center;
                justify-content: center;
                
                cursor: pointer;
              }

              .bg {
                position: absolute;
                height: 100%;
                width: 100%;
                top: 0;
                left: 0;

                opacity: 0.07;
                background-size: cover;
                background-image: url("/assets/art/casebg.png");
              }
            `}</style>
        </>
    );
}

export default CaseButton;
