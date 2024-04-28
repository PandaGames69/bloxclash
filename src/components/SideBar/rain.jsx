import {createEffect, createSignal} from "solid-js";
import {useRain} from "../../contexts/raincontext";
import Captcha from "../Captcha/captcha";
import {authedAPI, createNotification} from "../../util/api";
import Countup from "../Countup/countup";
import Avatar from "../Level/avatar";

function SidebarRain(props) {

    const [rain, userRain, time, userTimer, joinedRain] = useRain()
    const [token, setToken] = createSignal(null)
    const [showCaptcha, setShowCaptcha] = createSignal(false)

    async function joinRain() {
        let res = await authedAPI('/rain/join', 'POST', JSON.stringify({
            'captchaResponse': token()
        }), true)

        if (res.success) {
            setToken(null)
            joinedRain()
            createNotification('success', `Successfully joined the rain.`)
        }

        if (res.error === 'NOT_LINKED') {
            let discordRes = await authedAPI('/discord/link', 'POST', null, true)
            if (discordRes.url) {
                attemptToLinkDiscord(discordRes.url)
            }
        }

        setShowCaptcha(false)
    }

    function attemptToLinkDiscord(url) {
        let popupWindow = window.open(url, 'popUpWindow', 'height=700,width=500,left=100,top=100,resizable=yes,scrollbar=yes')
        window.addEventListener("message", function (event) {
            if (event.data === "Authorized") {
                popupWindow.close();
                joinRain()
            }
        }, false)
    }

    function handleRainJoin() {
        if (userRain()?.joined || rain()?.joined) return createNotification('error', 'You have already joined this rain.')

        setShowCaptcha(true)
        hcaptcha.render('captcha-div', {
            sitekey: '5029f0f4-b80b-42a8-8c0e-3eba4e9edc4c',
            theme: 'dark',
            callback: function (token) {
                setToken(token)
                joinRain()
            }
        });
    }

    function formatTimeLeft(ms) {
        const totalSeconds = Math.floor(ms / 1000)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <>
            <Captcha active={showCaptcha()} close={() => setShowCaptcha(false)}/>

            <div className='rain-container fadein'>
                {userRain() ? (
                    <Avatar id={userRain()?.host?.id} xp={userRain()?.host?.xp} height='30'/>
                ) : (
                    <img src='/assets/icons/logoswords.png' height='41' alt=''/>
                )}
                <p>{userRain()?.host?.username || 'BLOXCLASH'} <span className='gold'>HOSTED A RAIN</span></p>
                <div className='amount-backing'>
                    <img className='coin' src='/assets/icons/fancycoin.png' alt='' height='60'/>

                    <div class='timer'>
                        <img src='/assets/icons/timer.svg' height='20'/>
                        <p>{formatTimeLeft(userRain() ? userTimer() : time())}</p>
                    </div>

                    <div className='amount-container'>
                        <img src='/assets/icons/fancycoin.png' alt='' height='20'/>
                        <p><Countup end={userRain()?.amount || rain()?.amount || 0} gray={true}/></p>
                    </div>
                </div>
                <button className='bevel-gold claim' onClick={() => handleRainJoin()} disabled={userRain()?.joined || rain()?.joined}>
                    {(userRain()?.joined || rain()?.joined) ? 'YOU ARE IN THE RAIN' : 'CLAIM RAIN'}
                </button>
            </div>

            <style jsx>{`
              .rain-container {
                width: 100%;
                min-height: 100%;
                
                top: 0;
                left: 0;

                position: absolute;
                display: flex;
                flex-direction: column;
                z-index: 1;
                
                align-items: center;
                justify-content: center;
                gap: 10px;
                
                padding: 12px 20px;

                background: linear-gradient(277.39deg,rgba(19,17,41,1) -69.8%,rgba(37,31,78,1) 144.89%);

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 12px;
                font-weight: 700;
              }
              
              .amount-backing {
                width: 100%;
                height: 45px;

                background: linear-gradient(270deg, rgba(90, 84, 153, 0) 0%, rgba(249, 172, 57, 0.31) 98.73%, rgba(90, 84, 153, 0) 100%);
                border-radius: 0 0 8px 8px;

                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 16px;

                padding: 0 5px;
              }

              .amount-container {
                width: 100%;
                max-width: 130px;
                height: 30px;

                background: conic-gradient(from 180deg at 50% 50%, #FFDC18 -0.3deg, #B17818 72.1deg, rgba(156, 99, 15, 0.611382) 139.9deg, rgba(126, 80, 12, 0.492874) 180.52deg, rgba(102, 65, 10, 0.61) 215.31deg, #B17818 288.37deg, #FFDC18 359.62deg, #FFDC18 359.7deg, #B17818 432.1deg);
                border-radius: 5px;

                position: relative;

                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;

                font-family: 'Geogrotesque Wide';
                font-weight: 700;
                color: white;
                font-size: 13px;
              }

              .amount-container > * {
                position: relative;
                z-index: 1;
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

              .coin {
                position: absolute !important;
                left: -15px;
                z-index: 1;
              }
              
              .rain-container > * {
                position: relative;
                z-index: 1;
              }
              
              .timer {
                display: flex;
                align-items: center;
                gap: 4px;
                
                font-variant-numeric: tabular-nums;
              }
              
              .claim {
                width: 100%;
                height: 25px;

                font-family: Geogrotesque Wide, sans-serif;
                font-size: 11px;
                font-weight: 700;
              }
              
              .claim:disabled {
                box-shadow: unset;
                background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
                border: 1px solid #FCA31E;
                color: #FCA31E;
              }
              
              .fadein {
                animation: fadein 1s forwards ease;
              }
              
              @keyframes fadein {
                from {
                  opacity: 0%;
                }
                to {
                  opacity: 100%;
                }
              }
            `}</style>
        </>
    );
}

export default SidebarRain;
