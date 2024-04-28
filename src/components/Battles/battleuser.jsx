import Avatar from "../Level/avatar";
import Level from "../Level/level";
import {getCents} from "../../util/balance";
import {authedAPI} from "../../util/api";
import {For} from "solid-js";
import CaseItem from "../Cases/caseitem";

function BattleUser(props) {

    function sumItemsWon() {
        return getOwnPulls()?.reduce((pv, item) => pv + item?.price, 0)
    }

    function getOwnPulls() {
        if (!Array.isArray(props?.wonItems)) return
        return props?.wonItems?.filter(item => {
            if (props?.state !== 'WINNERS' && item.round >= props?.round) return false
            return item.userId === props?.player?.id
        })
    }

    return (
        <>
            <div class='battle-user-container'>
                <div class={'user-info ' + (props?.player ? 'active' : '')}>
                    <Avatar height='40' id={props?.player?.id || '?'} xp={props?.player?.xp || 'purple'} dark={!props.player}/>

                    <div class='name-container'>
                        <p class='username'>{props?.player?.username || 'WAITING FOR PLAYER'}</p>
                        {props?.player && (
                            <Level xp={props?.player?.xp}/>
                        )}
                    </div>

                    {props?.player ? (
                        <>
                            <div class='balance'>
                                <img src='/assets/icons/coin.svg' height='16px' width='16px' alt=''/>
                                <p>
                                    {Math.floor(sumItemsWon())}
                                    <span class='gray'>.{getCents(sumItemsWon())}</span>
                                </p>
                            </div>
                        </>
                    ) : (
                        <button class='bevel-gold call' onClick={async () => {
                            if (props?.creator) { return await authedAPI(`/battles/${props?.battle?.id}/bot`, 'POST', JSON.stringify({ slot: props.index + 1, pk: null }), true) }
                            await authedAPI(`/battles/${props?.battle?.id}/join`, 'POST', JSON.stringify({ slot: props.index + 1, privKey: props?.battle?.privKey }), true)
                        }}>{props?.creator ? 'CALL BOT' : 'JOIN'}</button>
                    )}
                </div>

                <div class='items'>
                    <For each={getOwnPulls()}>{(item, index) => <CaseItem grid={true} {...item}/>}</For>
                </div>
            </div>

            <style jsx>{`
              .battle-user-container {
                flex: 1;
                position: relative;
                height: fit-content;
                
                border-radius: 12px;
                overflow: hidden;
              }
              
              .user-info {
                width: 100%;
                height: 65px;
                background: linear-gradient(230deg, rgba(26, 14, 51, 0.15) 0%, rgba(66, 60, 122, 0.15) 100%), #453F7B;
                padding: 0 15px;
                display: flex;
                align-items: center;
                gap: 8px;

                color: #9A90D1;
                font-size: 16px;
                font-weight: 700;

                text-overflow: ellipsis;
              }
              
              .user-info.active {
                color: #FFF;
                font-size: 16px;
                font-weight: 700;
              }
              
              .items {
                width: 100%;
                min-height: 330px;
                background: rgb(48, 43, 90);
                padding: 15px;
                
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
                grid-gap: 10px;
              }
              
              .username {
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
              }
              
              .name-container {
                display: flex;
                gap: 2px 6px;
                flex-wrap: wrap;
                overflow: hidden;
              }
              
              .call {
                min-width: 90px;
                height: 30px;
                margin-left: auto;
              }
              
              .balance {
                min-width: 60px;
                height: 30px;
                background: linear-gradient(0deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.10) 100%), linear-gradient(230deg, rgba(26, 14, 51, 0.25) 0%, rgba(66, 60, 122, 0.25) 100%);
                margin-left: auto;

                color: #FFF;
                font-family: Geogrotesque Wide;
                font-size: 14px;
                font-weight: 700;
                box-sizing: content-box;
                
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 0 10px;
              }

              @media only screen and (max-width: 1040px) {
                .battle-user-container {
                  width: 100%;
                }
              }
            `}</style>
        </>
    );
}

export default BattleUser;
