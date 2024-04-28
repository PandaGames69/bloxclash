import {createEffect} from "solid-js";

function JackpotUser(props) {

    let jpUser

    createEffect(() => {
        if (props?.state === 'rolling' && (props?.index > 40 && props?.index < 60)) {
            window.requestAnimationFrame(applyMix)
        }
    })

    let start
    function applyMix(timeStamp) {
        if (!start) { start = timeStamp }
        let elapsed = timeStamp - start

        if (elapsed > 5000) {
            start = null

            if (props?.index === 50) {
                jpUser.classList.toggle('won')
            } else {
                jpUser.classList.toggle('lum')
            }

            return window.requestAnimationFrame(removeMix)
        }
        window.requestAnimationFrame(applyMix)
    }

    function removeMix(timeStamp) {
        if (!start) { start = timeStamp }
        let elapsed = timeStamp - start

        if (elapsed > 2000) {
            start = null

            if (props?.index === 50) {
                jpUser.classList.toggle('won')
            } else {
                jpUser.classList.toggle('lum')
            }

            return
        }
        window.requestAnimationFrame(removeMix)
    }

    return (
        <>
            <div class={'jackpot-user ' + (props?.won ? 'won big ' : '')} ref={jpUser}>
                <p class='percent'>{((props?.percent || 0) * 100)?.toFixed(2)}%</p>
                <img src={props?.id ? `${import.meta.env.VITE_SERVER_URL}/user/${props?.id}/img` : '/assets/icons/anon.png'} alt='' height='48' width='48'/>
                <div class='bar' style={{background: props?.color}}/>
            </div>

            <style jsx>{`
              .jackpot-user {
                min-width: 80px;
                height: 80px;
                
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                position: relative;

                border-radius: 7px;
                background: radial-gradient(93.13% 93.13% at 50.00% 93.13%, rgba(252, 163, 30, 0.15) 0%, rgba(0, 0, 0, 0.00) 100%), rgba(0, 0, 0, 0.15);
                
                overflow: hidden;
                border: 1px solid transparent;
                transition: all .3s;
              }
              
              .lum {
                mix-blend-mode: luminosity;
                opacity: 0.5;
              }
              
              .won {
                background: radial-gradient(93.13% 93.13% at 50.00% 6.87%, rgba(252, 163, 30, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
                box-shadow: 0px 2px 15px 0px rgba(0, 0, 0, 0.25);
                border: 1px solid rgba(252, 163, 30, 1);
                filter: drop-shadow(0px 0px 25px rgba(252, 163, 30, 0.54));
              }
              
              .big {
                height: 90px;
                width: 90px;
              }
              
              .won .bar {
                background: #FCA31E !important;
              }
              
              .won .percent {
                background: linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
                color: white;
              }
              
              .index {
                position: absolute;
                color: white;
                font-weight: 700;
                font-size: 16px;
              }
              
              .percent {
                width: 60px;
                height: 20px;
                
                line-height: 20px;
                text-align: center;
                color: #ADA3EF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 11px;
                font-weight: 700;
                
                background: rgba(90, 84, 153, 0.35);
                border-radius: 3px;
                margin: auto 0;
              }
              
              .bar {
                width: 100%;
                height: 2px;
                transition: background .3s;
              }
            `}</style>
        </>
    );
}

export default JackpotUser;
