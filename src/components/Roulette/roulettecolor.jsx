import Avatar from "../Level/avatar";
import {authedAPI, createNotification} from "../../util/api";
import {createEffect, createSignal, For} from "solid-js";

const iconName = {
    'red': 'redtiki.png',
    'green': 'greentiki.png',
    'gold': 'goldsword.png'
}

const COLORS = {
    'gold': 0,
    'green': 1,
    'red': 2,
}

function RouletteColor(props) {

    const [bets, setBets] = createSignal([])

    createEffect(() => {
        setBets(getBetForColor())
    })

    function getBetForColor() {
        let colorNum = COLORS[props?.color]
        return props?.bets?.filter(bet => bet.color === colorNum)?.sort((a,b) => b.amount - a.amount)
    }

    function isGrayed() {
        if (props?.state !== 'WINNERS') return ''
        if (props?.round?.color === COLORS[props?.color]) return ''
        return 'gray'
    }

    function getWonAmount(amount) {
        let prefix = numberPrefix()
        if (prefix === '') return amount
        if (prefix === '-') return amount
        if (props?.color === 'gold') return amount * 14
        return amount * 2
    }

    function numberPrefix() {
        if (props?.state !== 'WINNERS') return ''
        if (props?.round?.color === COLORS[props?.color]) return '+'
        return '-'
    }

    return (
        <>
            <div class={'bet-column ' + (isGrayed())}>
                <button class={'color ' + props.color} onClick={async () => {
                    if (props?.amount < 1) return

                    let res = await authedAPI('/roulette/bet', 'POST', JSON.stringify({
                        color: COLORS[props?.color],
                        amount: props?.amount || 0,
                    }), true)

                    if (res.success) {
                        createNotification('success', `Successfully placed a bet on ${props?.color} for ${props?.amount} robux.`)
                    }
                }}>
                    <img src={`assets/icons/${iconName[props.color]}`} alt='' height='50'/>
                    <p>PLACE BET</p>
                    <p class={'win ' + props.color}>WIN {props?.color === 'gold' ? '14' : '2'}X</p>
                </button>

                <div class='bets-header'>
                    <p>{bets()?.length} PLAYERS</p>

                    <p class='total gold'>
                        <img src='/assets/icons/coin.svg' height='15' alt=''/>
                        {numberPrefix()}
                        {getWonAmount(bets()?.reduce((pv, bet) => pv + bet.amount, 0))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>

                <div class='bets'>
                    <For each={bets()}>{(bet, index) => (
                        <div class={'bet ' + (props?.color + '-') + (index() === 0 ? 'top' : '')}>
                            <div class='user'>
                                <Avatar id={bet?.user?.id} xp={bet?.user?.xp} height={30}/>
                                <p>{bet?.user?.username}</p>

                                {index() === 0 && (
                                    <p class='top-bet'>TOP BET</p>
                                )}
                            </div>

                            <p class='total'>
                                <img src='/assets/icons/coin.svg' height='15' alt=''/>
                                {numberPrefix()}
                                {getWonAmount(bet?.amount)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    )}</For>
                </div>
            </div>

            <style jsx>{`
              .bet-column {
                flex: 1;
                display: flex;
                flex-direction: column;
                transition: opacity .3s;
              }

              .gray {
                opacity: 0.5;
                mix-blend-mode: luminosity;
              }

              .color {
                color: #FFF !important;
                font-size: 15px;
                font-family: Geogrotesque Wide;
                font-weight: 700;

                outline: unset;
                width: unset;
                border: unset;
                background: unset;

                min-height: 70px;
                max-height: 70px;
                padding: 0 20px;

                display: flex;
                align-items: center;
                gap: 20px;
                flex: 1;

                cursor: pointer;
              }

              .color.green {
                border-radius: 7px;
                border: 1px solid #41D163;
                background: rgba(65, 209, 99, 0.25);
                box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.15);
              }

              .color.gold {
                border-radius: 7px;
                border: 1px solid #FF9900;
                background: linear-gradient(37deg, rgba(255, 153, 0, 0.25) 30.03%, rgba(249, 172, 57, 0.25) 42.84%);
                box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.15);
              }

              .color.red {
                border-radius: 7px;
                border: 1px solid #F04B69;
                background: rgba(197, 56, 82, 0.25);
                box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.15);
              }

              .color.red img {
                filter: drop-shadow(0px 0px 15px #C53852);
              }

              .color.green img {
                filter: drop-shadow(0px 0px 15px #41D163);
              }

              .bets-header {
                margin-top: 35px;
                min-height: 30px;
                border-radius: 5px 5px 0 0;
                background: linear-gradient(238deg, #6159B0 0%, #43378D 100%);

                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 15px;

                color: #9F9AC8;
                font-size: 14px;
                font-weight: 700;
              }

              .total {
                display: flex;
                align-items: center;
                gap: 5px;
              }

              .bet {
                background: #403B73;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 15px;

                min-height: 50px;

                color: #FFF;
                font-size: 14px;
                font-family: Geogrotesque Wide;
                font-weight: 700;
              }

              .green-top {
                background: rgba(65, 209, 99, 0.10);
              }

              .gold-top {
                background: linear-gradient(37deg, rgba(255, 153, 0, 0.10) 30.03%, rgba(249, 172, 57, 0.10) 42.84%);
              }

              .red-top {
                background: rgba(240, 75, 105, 0.10);
              }

              .green-top .total {
                color: #41D163;
              }

              .gold-top .total {
                color: var(--gold);
              }

              .red-top .total {
                color: #F04B69;
              }

              .green-top .top-bet {
                color: #41D163;
                text-shadow: 0px 0px 15px #41D163;
              }

              .gold-top .top-bet {
                color: var(--gold);
                text-shadow: 0px 0px 15px #FE9F12;
              }

              .red-top .top-bet {
                color: #F04B69;
                text-shadow: 0px 0px 15px #F04B69;
              }

              .top-bet {
                font-size: 10px;
                font-weight: 700;
              }

              .user {
                display: flex;
                gap: 10px;
                align-items: center;
              }

              .win {
                margin-left: auto;
              }

              .green {
                color: #59E878;
              }

              .gold {
                color: var(--gold);
              }

              .red {
                color: #C53852;
              }

              @media only screen and (max-width: 875px) {
                .bets-header {
                  margin-top: 16px !important;
                }
              }
            `}</style>
        </>
    );
}

export default RouletteColor;
