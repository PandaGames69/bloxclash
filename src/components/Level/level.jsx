import {getUserLevel} from "../../resources/levels";
import {createEffect, createSignal} from "solid-js";

function Level(props) {

    const [level, setLevel] = createSignal(0)

    createEffect(() => {
        setLevel(getUserLevel(props?.xp))
    })

    function levelToColor(level) {
        if (level < 2) return ''
        if (level < 26) {
            return 'green'
        }
        if (level < 51) {
            return 'blue'
        }
        if (level < 76) {
            return 'pink'
        }
        if (level < 100) {
            return 'gem'
        }
        return 'fire'
    }

    return (
        <>
            <div class={'level ' + levelToColor(level()) + (props?.blend ? ' blend' : '')}>
                {levelToColor(level()) === 'gem' ? (
                    <img src='/assets/icons/greengem.png' height='10' alt=''/>
                ) : levelToColor(level()) === 'fire' ? (
                    <img src='/assets/icons/goldfire.png' height='10' alt=''/>
                ) : ''}
                <p>{level()}</p>
            </div>

            <style jsx>{`

                .level {
                    font-family: 'Geogrotesque Wide', sans-serif;
                    font-weight: 700;
                    font-size: 10px;
                    color: white;

                    background: #8F8DA1;
                    padding: 0 5px;
                    height: 18px;
                    border-radius: 3px;

                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .level p {
                    margin-top: -1px;
                }

                .level.green {
                    background: #56B66B;
                }

                .blue.level {
                    background: #559EE4;
                    color: #D9D9D9;
                }

                .level.pink {
                    background: #BF50D1;
                    color: #D9D9D9;
                }

                .level.gem {
                    border: 1px solid #04B79D;
                    background: linear-gradient(90deg, rgba(156, 255, 172, 0.25) 0%, rgba(0, 181, 156, 0.25) 100%);
                    border-radius: 3px;
                }

                .level.gem p {
                    background: linear-gradient(90deg, #9CFFAC 0%, #00B59C 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-fill-color: transparent;
                }

                .level.fire {
                    border: 1px solid #FF9900;
                    background: linear-gradient(53.13deg, rgba(255, 153, 0, 0.25) 54.58%, rgba(249, 172, 57, 0.25) 69.11%);
                    border-radius: 3px;
                }

                .level.fire p {
                    background: linear-gradient(53.13deg, #FF9900 54.58%, #F9AC39 69.11%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-fill-color: transparent;
                    font-weight: 700;
                }
            `}</style>
        </>
    );
}

export default Level;
