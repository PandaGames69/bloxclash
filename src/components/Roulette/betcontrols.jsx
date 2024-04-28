function RouletteBetControls(props) {

    function changeBetAmount(num) {
        let baseValue = isNaN(props.bet) ? 0 : props.bet
        props.setBet(Math.abs(Math.floor((baseValue + num) * 100)) / 100)
    }

    return (
        <>
            <div class='bet-container'>
                <p>BET AMOUNT</p>

                <div class='bet-amount-wrapper'>
                    <img src='/assets/icons/coin.svg' height='16' alt=''/>
                    <input class='bet-amount' type='number' placeholder='0' value={props.bet}
                           onChange={(e) => props.setBet(Math.abs(e.target.valueAsNumber))}/>
                </div>

                <button class='control' onClick={() => props.setBet(0)}>
                    <p class='lightgray'>CLEAR</p>
                </button>

                <button class='control' onClick={() => changeBetAmount(10)}>
                    <img src='/assets/icons/coin.svg' height='15' alt=''/>
                    <p>+10<span class='gray'>.00</span></p>
                </button>

                <button class='control' onClick={() => changeBetAmount(500)}>
                    <img src='/assets/icons/coin.svg' height='15' alt=''/>
                    <p>+500<span class='gray'>.00</span></p>
                </button>

                <button class='control' onClick={() => changeBetAmount(1000)}>
                    <img src='/assets/icons/coin.svg' height='15' alt=''/>
                    <p>+1,000<span class='gray'>.00</span></p>
                </button>

                <button class='control' onClick={() => changeBetAmount(10000)}>
                    <img src='/assets/icons/coin.svg' height='15' alt=''/>
                    <p>+10,000<span class='gray'>.00</span></p>
                </button>

                <button class='control' onClick={() => changeBetAmount(25000)}>
                    <img src='/assets/icons/coin.svg' height='15' alt=''/>
                    <p>+25,000<span class='gray'>.00</span></p>
                </button>

                <button class='control' onClick={() => changeBetAmount(props.bet / -2)}>
                    <p class='gray'>1/2</p>
                </button>

                <button class='control' onClick={() => changeBetAmount(props.bet)}>
                    <p class='gray'>2X</p>
                </button>

                <button class='control' onClick={() => props.setBet(props?.user?.balance || 0)}>
                    <p class='gold'>MAX</p>
                </button>
            </div>

            <style jsx>{`
              .bet-container {
                min-height: 75px;
                border-radius: 7px;
                border: 1px solid #4C4981;
                background: rgba(11, 9, 26, 0.15);

                margin: 35px 0;

                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 10px;

                color: #9F9AC8;
                font-size: 14px;
                font-weight: 700;

                padding: 10px 20px;
              }

              .bet-amount-wrapper {
                border-radius: 3px;
                border: 1px solid #3E3771;
                background: #2D2953;

                display: flex;
                align-items: center;

                width: 200px;
                height: 45px;

                gap: 8px;
                padding: 0 12px;
              }

              .bet-amount {
                width: 100%;
                height: 100%;
                border: unset;
                outline: unset;
                background: unset;
                color: white;

                color: #FFF;
                font-size: 14px;
                font-family: Geogrotesque Wide;
                font-weight: 700;
              }

              .control {
                height: 45px;
                width: fit-content;
                flex-grow: 1;

                border: unset;
                outline: unset;
                cursor: pointer;

                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;

                color: #FFF;
                font-size: 14px;
                font-family: Geogrotesque Wide;
                font-weight: 700;

                border-radius: 3px;
                background: #413976;
                box-shadow: 0px 1px 0px 0px #242044, 0px -1px 0px 0px #5B509E;
              }

              .control:active {
                box-shadow: 0px 1px 0px #282445;
              }

              .lightgray {
                color: #9F9AC8;
              }
            `}</style>
        </>
    );
}

export default RouletteBetControls;
