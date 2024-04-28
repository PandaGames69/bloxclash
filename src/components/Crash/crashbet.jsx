import Avatar from "../Level/avatar";
import Countup from "../Countup/countup";

function CrashBet(props) {

    function getBetState() {
        if (props?.bet?.cashoutPoint) return 'won'
        if (props?.state === 'crashed') return 'crashed'
        return ''
    }

    return (
        <>
            <div class={'crash-bet ' + (getBetState())}>
                <div class='section'>
                    <Avatar id={props?.bet?.user?.id} xp={props?.bet?.user?.xp || 0} height='22'/>
                    <p>{props?.bet?.user?.username || 'Anonymous'}</p>
                </div>

                {props?.bet?.cashoutPoint && (
                    <p class='multi'>{(props?.bet?.cashoutPoint || 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x</p>
                )}

                <div class='section'>
                    <img src='/assets/icons/coin.svg' height='16' width='16' alt=''/>
                    <p class={props?.bet?.cashoutPoint ? 'gold' : ''}>
                        {getBetState() === 'won' ? '+' : getBetState() === 'crashed' ? '-' : ''}
                        <Countup end={props?.bet?.winnings || props?.bet?.amount || 0} init={false} gray={true}/>
                    </p>
                </div>
            </div>

            <style jsx>{`
              .crash-bet {
                width: 100%;
                height: 40px;
                
                background: #1D183C;
                
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 10px;
                gap: 8px;

                font-family: Geogrotesque Wide, sans-serif;
                color: #FFF;
                font-size: 12px;
                font-weight: 700;
              }
              
              .crash-bet.crashed {
                mix-blend-mode: luminosity;
              }
              
              .section {
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .multi {
                text-shadow: 0px 1px 0px rgba(255, 153, 1, 0.30);
                font-size: 14px;
                font-weight: 700;
                
                background: linear-gradient(37deg, #F90 30.03%, #F9AC39 42.84%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              
              .crash-bet:nth-child(2n - 1) {
                background: unset;
              }
            `}</style>
        </>
    );
}

export default CrashBet
