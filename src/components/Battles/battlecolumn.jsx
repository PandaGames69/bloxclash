import BattleSpinner from "./battlespinner";
import BattleUser from "./battleuser";
import {createEffect, createSignal} from "solid-js";

function BattleColumn(props) {

    return (
        <>
            <div class='column'>
                <div class='container'>
                    <BattleSpinner index={props?.index}
                                   battle={props?.battle}
                                   player={props?.player}
                                   team={props?.team}
                                   startOfTeam={props?.startOfTeam}
                                   state={props?.state}
                                   round={props?.round}
                                   rounds={props?.rounds}
                                   winnerTeam={props?.winnerTeam}
                                   max={props?.max}
                                   creator={props?.creator}
                                   wonItems={props?.wonItems}
                                   total={props?.total}
                                   roundWinners={props?.roundWinners}
                    />
                </div>

                <div class='container'>
                    <BattleUser index={props?.index}
                                players={props?.players}
                                battle={props?.battle}
                                state={props?.state}
                                round={props?.round}
                                rounds={props?.rounds}
                                player={props?.player}
                                creator={props?.creator}
                                wonItems={props?.wonItems}
                    />
                </div>
            </div>

            <style jsx>{`
              .column {
                flex: 1 0 0;
                display: flex;
                flex-direction: column;
                gap: 35px;
                min-width: 0;
              }
              
              .container {
                width: 100%;
                height: fit-content;
              }
            `}</style>
        </>
    );
}

export default BattleColumn;
