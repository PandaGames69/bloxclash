import {createNotification} from "../../util/api";

function Method(props) {

    function getState() {
        if (props?.disabled) return ' disabled'
        if (props?.active) return ' active'
        return ''
    }

    return (
        <>
            <div class={'method-container' + getState()} onClick={() => {
                if (props?.disabled) return createNotification('error', 'This payment method is currently disabled')
                props?.click()
            }} aria-disabled={!!props?.disabled}>
                <div class='title'>
                    <p>{props?.name}</p>
                </div>
                <img src={props?.img} height={props?.height || '56'} alt=''/>
            </div>

            <style jsx>{`
              .method-container {
                height: 135px;
                
                display: flex;
                flex-direction: column;
                align-items: center;
                
                padding: 10px;

                position: relative;
                border-radius: 7px;
                background: conic-gradient(from 180deg at 50% 50%, #FFDC18 -0.3deg, #B17818 72.1deg, rgba(156, 99, 15, 0.611382) 139.9deg, rgba(126, 80, 12, 0.492874) 180.52deg, rgba(102, 65, 10, 0.61) 215.31deg, #B17818 288.37deg, #FFDC18 359.62deg, #FFDC18 359.7deg, #B17818 432.1deg);
                box-shadow: 0px 2px 15px 0px rgba(0, 0, 0, 0.10);
                
                z-index: 0;
                cursor: pointer;
                transition: all .2s;
              }
              
              .method-container.disabled {
                filter: grayscale(1);
                cursor: default;
              }
              
              .method-container:not(.active) {
                mix-blend-mode: luminosity;
                opacity: 0.35;
              }
              
              .method-container:before {
                position: absolute;
                width: calc(100% - 2px);
                height: calc(100% - 2px);
                top: 1px;
                left: 1px;
                content: '';
                
                border-radius: 7px;
                background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(252, 164, 33, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(238deg, #302E5B 0%, #372F68 100%);
                z-index: -1;
              }
              
              img {
                transition: transform .3s;
                margin: auto 0;
              }
              
              .method-container:not(.disabled):hover img {
                transform: scale(1.05);
              }

              .title {
                height: 25px;
                padding: 0 8px;
                
                border-radius: 3px;
                background: conic-gradient(from 180deg at 50% 50%, #FFDC18 -0.3deg, #B17818 72.1deg, rgba(156, 99, 15, 0.611382) 139.9deg, rgba(126, 80, 12, 0.492874) 180.52deg, rgba(102, 65, 10, 0.61) 215.31deg, #B17818 288.37deg, #FFDC18 359.62deg, #FFDC18 359.7deg, #B17818 432.1deg);
                box-shadow: unset;
                border: unset;
                position: relative;
                z-index: 0;
              }

              .title:before {
                border-radius: 3px;
                position: absolute;
                width: calc(100% - 2px);
                height: calc(100% - 2px);
                top: 1px;
                left: 1px;
                content: '';
                background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%), #4A457D;
                z-index: -1;
              }
              
              .title p {
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 14px;
                font-weight: 700;
                line-height: 25px;
                text-align: center;
                
                background: linear-gradient(37deg, #F90 30.03%, #F9AC39 42.84%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }
            `}</style>
        </>
    );
}

export default Method;
