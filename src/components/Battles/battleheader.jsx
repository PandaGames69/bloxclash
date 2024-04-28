import {A} from "@solidjs/router";
import {getCents} from "../../util/balance";
import {For} from "solid-js";

function BattleHeader(props) {

    function getType() {
        if (props?.battle?.gamemode === 'group') return 'Group'
        if (props?.battle?.playersPerTeam === 2 && props?.battle?.teams === 2) return '2v2'
        if (props?.battle?.playersPerTeam === 1 && props?.battle?.teams === 4) return '1v1v1v1'
        if (props?.battle?.playersPerTeam === 1 && props?.battle?.teams === 3) return '1v1v1'
        if (props?.battle?.playersPerTeam === 1 && props?.battle?.teams === 2) return '1v1'
        return Array(props?.battle?.teams).map(e => props?.battle?.playersPerTeam).join('v')
    }

    function getStateText() {
        if (props?.state === 'WAITING') return 'Waiting for Players...'
        if (props?.state === 'EOS') return `Waiting for EOS Block #${props?.block}`
        return ''
    }

    function getActiveCase() {
        let round = props?.battle?.rounds[props?.round - 1]
        if (!round) return
        let caseId = round.caseId
        let c = getCase(caseId)

        return c
    }

    function getCase(id) {
        return props?.battle?.cases?.find(c => id === c.id)
    }

    return (
        <>
            <div class='battle-header'>
                <div class='header-section'>
                    <button class='back' class='bevel-light'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="5" height="8" viewBox="0 0 5 8" fill="none">
                            <path
                                d="M0.4976 4.00267C0.4976 3.87722 0.545618 3.75178 0.641454 3.65613L3.65872 0.646285C3.85066 0.454819 4.16185 0.454819 4.35371 0.646285C4.54556 0.837673 4.4976 1.00269 4.4976 1.33952L4.4976 4.00267L4.4976 6.50269C4.4976 7.00269 4.54547 7.16764 4.35361 7.35902C4.16175 7.55057 3.85056 7.55057 3.65863 7.35902L0.641361 4.34921C0.545509 4.25352 0.4976 4.12808 0.4976 4.00267Z"
                                fill="#ADA3EF"/>
                        </svg>
                        <p>BACK</p>
                        <A href='/battles' class='gamemode-link'></A>
                    </button>

                    <div class={'mode ' + (props?.battle?.gamemode === 'group' ? 'group' : '')}>
                        {props?.battle?.gamemode === 'group' && (
                            <img src='/assets/icons/hands.svg' height='17' width='12' alt=''/>)}
                        <p>{getType()}</p>
                    </div>

                    {props?.battle?.gamemode === 'crazy' && (
                        <div class='crazy'>
                            <img src='/assets/icons/crazy.svg' height='14' alt=''/>
                            <p>CRAZY</p>
                        </div>
                    )}
                </div>

                <div class='header-section'>
                    {getStateText() === '' ? (
                        <div class='case-info'>
                            <p>{getActiveCase()?.name}</p>

                            <div class='cost'>
                                <img src='/assets/icons/coin.svg' height='16' alt=''/>
                                <p>{Math.floor(getActiveCase()?.price || 0)}<span class='gray'>.{getCents(getActiveCase()?.price || 0)}</span></p>
                            </div>
                        </div>
                    ) : (
                        <p class='state'>{getStateText()}</p>
                    )}
                </div>

                <div class='header-section'>
                    <p class='total'>TOTAL COST</p>
                    <div class='cost'>
                        <img src='/assets/icons/coin.svg' height='16' alt=''/>
                        <p>{Math.floor(props?.battle?.entryPrice || 0)}<span class='gray'>.{getCents(props?.battle?.entryPrice || 0)}</span></p>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .battle-header {
                display: flex;
                justify-content: space-between;
              }

              .header-section {
                display: flex;
                align-items: center;
                flex: 1;
                gap: 12px;
                justify-content: center;
              }
              
              .header-section:first-child {
                justify-content: flex-start;
              }
              
              .header-section:last-child {
                justify-content: flex-end;
              }
              
              .case-info {
                display: flex;
                align-items: center;
                gap: 12px;

                color: #FFF;
                font-size: 15px;
                font-weight: 700;
              }
              
              .back {
                height: 30px;
                padding: 0 10px;
                font-weight: 700;
                font-family: Geogrotesque Wide;
                position: relative;
                
                display: flex;
                align-items: center;
              }

              .back p {
                margin-top: -3px;
              }
              
              .back svg {
                margin-right: 6px;
              }
              
              .state {
                color: #FFF;
                font-size: 16px;
                font-weight: 600;
              }
              
              .total {
                color: #ADA3EF;
                font-size: 15px;
                font-weight: 700;
              }

              .cost {
                height: 30px;
                font-size: 14px;
                padding: 0 10px;
                min-width: 100px;
                gap: 6px;
              }

              .cost p {
                margin-top: -2px;
              }

              .mode, .crazy {
                width: 80px;
                height: 30px;
                background: url("/assets/art/stripes.png"), #1F1D39;
                background-size: cover;

                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                border-radius: 5px;

                color: #8E8ABD;
                font-size: 13px;
                font-weight: 700;
              }

              .mode.group {
                color: #FFF;
                background: url("/assets/art/stripes.png"), linear-gradient(0deg, rgba(89, 232, 120, 0.25) 0%, rgba(89, 232, 120, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
              }

              .mode p, .crazy p {
                margin-top: -2px;
              }

              .crazy {
                left: 80px;
                color: #FFF;
                background: url("/assets/art/stripes.png"), #69452B;
              }

              @media only screen and (max-width: 540px) {
                .battles-header {
                  justify-content: center;
                  flex-direction: column;
                  align-items: center;
                  gap: 25px;
                }
              }
            `}</style>
        </>
    );
}

export default BattleHeader;
