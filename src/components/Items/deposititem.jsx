import {createEffect, createSignal} from "solid-js";

function DepositItem(props) {

    let slider

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

    createEffect(() => {
        if (typeof props?.percent === 'number') {
            createTrail()
        }
    })

    function createTrail() {
        let value = (slider.value / 21) * 100 // 21 because it bugged w 20 when it hit 0 so min is now 1
        slider.style.background = 'linear-gradient(to right, #DB4C3E 0%, #DB4C3E ' + value + '%, #1D1D31 ' + value + '%, #1D1D31 100%)'
    }

    return (
        <>
            <div class={'deposit-item-container ' + (props?.active ? 'active' : '')} onClick={props?.click}>

                <p className='name'>{props?.name || 'Unknown Item'}</p>

                <div class={'item-content ' + (getRarity(props?.price || 0))}>
                    {props?.isOnHold && (
                      <img src='/assets/icons/held.svg' height='12' width='12' className='held'/>
                    )}

                    <img src={props.img} height='75' alt='' draggable={false}/>
                </div>

                <div class='horz'>
                    <img src='/assets/icons/coin.svg' height='12' alt=''/>
                    <p>{props?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                    <p class='percent'>{(props?.percent || 11) - 11}%</p>
                </div>

                <input ref={slider} type='range' className='range' value={props?.percent || 0} min={1} max={21}
                       onInput={(e) => {
                           props?.setPercent(props?.userAssetId, e.target.valueAsNumber)
                       }}
                />
            </div>

            <style jsx>{`
              .deposit-item-container {
                width: 100%;
                min-height: 170px;
                height: 170px;

                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                gap: 10px;

                border-radius: 8px;
                z-index: 0;
                padding: 12px 10px;

                border: 1px solid #312E5F;
                background: rgba(52, 49, 97, 0.26);
                box-shadow: 0px 2px 15px 0px rgba(0, 0, 0, 0.10);

                cursor: pointer;
                transition: all .2s;
                user-select: none;
              }

              .active {
                border: 1px solid #FCA31E;
                background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
                box-shadow: 0px 2px 15px 0px rgba(0, 0, 0, 0.10);
              }

              .active .name {
                color: white;
              }

              .held {
                position: absolute;
                top: 6px;
                right: 6px;
              }

              .item-content {
                display: flex;
                align-items: center;
                justify-content: center;

                position: relative;
                z-index: 0;

                width: 100%;
                max-width: 110px;
                height: 80px;

                border-radius: 8px;
                padding: 12px;
              }

              .gray {
                background: linear-gradient(45deg, rgba(169, 181, 210, 1), rgba(169, 181, 210, 0) 70%);
              }

              .blue {
                background: linear-gradient(45deg, rgba(65, 118, 255, 1), rgba(65, 118, 255, 0) 70%);
              }

              .pink {
                background: linear-gradient(45deg, rgba(220, 95, 222, 1), rgba(220, 95, 222, 0) 70%);
              }

              .red {
                background: linear-gradient(45deg, rgba(255, 81, 65, 1), rgba(255, 81, 65, 0) 70%);
              }

              .gold {
                background: linear-gradient(45deg, rgba(255, 153, 1, 1), rgba(255, 153, 1, 0) 70%);
              }

              .item-content:before {
                position: absolute;
                content: '';
                border-radius: 8px;
                z-index: -1;
                background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(169, 181, 210, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #312C5A;
                top: 1px;
                left: 1px;
                width: calc(100% - 2px);
                height: calc(100% - 2px);
              }

              .blue:before {
                background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(65, 118, 255, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #312C5A;
              }

              .pink:before {
                background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(220, 95, 222, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #312C5A;
              }

              .red:before {
                background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(255, 81, 65, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #493534;
              }

              .gold:before {
                background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(252, 164, 33, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #312C5A;
              }

              .name {
                color: #ADA3EF;
                text-align: center;
                font-size: 12px;
                font-weight: 700;
              }

              .horz {
                display: flex;
                align-items: center;
                gap: 8px;

                color: #FFF;
                font-size: 13px;
                font-weight: 700;

                margin-bottom: 16px;
              }

              .percent {
                position: absolute;
                left: 10px;

                height: 20px;
                padding: 0 8px;

                color: #FFF;
                font-size: 10px;
                font-weight: 700;

                border-radius: 6px 0;
                background: linear-gradient(155deg, #56539A 0%, #46437C 100%);
                line-height: 20px;
              }

              .range {
                outline: unset;
                -webkit-appearance: none;
                appearance: none;

                border-radius: 0 0 10px 10px;
                background: #DB4C3E;
                width: 100%;
                height: 5px;

                position: absolute;
                bottom: -2.5px;
                left: -1px;
              }

              .range::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 10px;
                height: 10px;
                background: white;
                cursor: pointer;
                border-radius: 50%;
              }

              .range::-moz-range-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 10px;
                height: 10px;
                background: white;
                cursor: pointer;
                border-radius: 50%;
              }
            `}</style>
        </>
    );
}

export default DepositItem;
