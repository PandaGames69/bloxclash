import {createEffect, createResource, createSignal, For, Show} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";
import {useUser} from "../../contexts/usercontextprovider";
import Switch from "../Toggle/switch";
import Loader from "../Loader/loader";

function Settings(props) {

    let slider
    const [mentions, setMentions] = createSignal(localStorage.getItem('mentions') === 'true')
    const [discord, { mutate }] = createResource(fetchDiscord)
    const [linked, setLinked] = createSignal(false)
    const [sound, setSound] = createSignal(localStorage.getItem('sound') || 100)
    const [user, { mutateUser }] = useUser()

    createEffect(() => {
        if (!localStorage.getItem('sound')) {
            localStorage.setItem('sound', 100)
            setSound(100)
        }

        if (localStorage.getItem('mentions') === undefined) {
            localStorage.setItem('mentions', true)
        }

        if (sound()) {
            createTrail()
        }
    })

    async function fetchDiscord() {
        try {
            let discord = await authedAPI(`/discord`, 'GET', null)
            if (discord.status === 'LINKED') setLinked(true)
            return mutate(discord)
        } catch (e) {
            console.log(e)
            return mutate(null)
        }
    }

    function createTrail() {
        let value = (slider.value - 0) / 100 * 100
        slider.style.background = 'linear-gradient(to right, #5F5CA6 0%, #5F5CA6 ' + value + '%, #2B284E ' + value + '%, #2B284E 100%)'
    }

    return (
        <>
            <div class='settings-container fadein'>
                <div class='table-header'>
                    <div class='table-column'>
                        <p>SETTING</p>
                    </div>

                    <div class='table-column'>
                        <p>ACTION</p>
                    </div>
                </div>

                <div class='table-data'>
                    <div class='table-column'>
                        <p>SOUND</p>
                    </div>

                    <div class='table-column'>
                        <input ref={slider} type='range' className='range' value={sound()}
                               onInput={(e) => {
                                   setSound(e.target.valueAsNumber)
                                   localStorage.setItem('sound', sound())
                               }}
                        />
                    </div>
                </div>

                <div class='table-data'>
                    <div class='table-column'>
                        <p>ANONYMOUS MODE</p>
                    </div>

                    <div class='table-column'>
                        <Switch dark={true} active={user()?.anon} toggle={async () => {
                            let res = await authedAPI('/user/anon', 'POST', JSON.stringify({
                                enable: !user()?.anon
                            }))

                            if (res.success) {
                                mutateUser({...user(), anon: !user()?.anon})
                            }
                        }}/>
                    </div>
                </div>

                <div class='table-data'>
                    <div class='table-column'>
                        <p>CHAT MENTIONS</p>
                    </div>

                    <div class='table-column'>
                        <Switch dark={true} active={mentions()} toggle={async () => {
                            setMentions(!mentions())
                            localStorage.setItem('mentions', mentions())
                        }}/>
                    </div>
                </div>

                <div class='table-data'>
                    <div class='table-column'>
                        <p>LINK DISCORD</p>
                    </div>

                    <Show when={!discord.loading} fallback={<Loader type='small'/>}>
                        <button className={linked() ? 'unlink' : 'bevel-gold link'} onClick={async () => {
                            if (linked()) {
                                let res = await authedAPI('/discord/unlink', 'POST', null, true)
                                if (res.status === 'NOT_LINKED' || res.status === 'UNLINKED' || res.success) {
                                    createNotification('success', 'Successfully unlinked your discord')
                                    setLinked(false)
                                }

                                return
                            }

                            let res = await authedAPI('/discord/link', 'POST', null, true)
                            if (res.url) {
                                let popupWindow = window.open(res.url, 'popUpWindow', 'height=700,width=500,left=100,top=100,resizable=yes,scrollbar=yes')
                                window.addEventListener("message", function (event) {
                                    if (event.data.type === "discord") {
                                        popupWindow.close();
                                        setLinked(true)
                                    }
                                }, false)
                            }
                        }}>{linked() ? 'UNLINK' : 'LINK'}</button>
                    </Show>
                </div>
            </div>

            <style jsx>{`
              .settings-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }

              .bar {
                width: 100%;
                height: 1px;
                min-height: 1px;
                background: #5A5499;
              }
              
              .table-header {
                margin-bottom: 20px;
              }

              .table-header, .table-data {
                display: flex;
                justify-content: space-between;
              }

              .table-data {
                height: 55px;
                background: rgba(90, 84, 153, 0.35);
                padding: 0 20px;

                display: flex;
                align-items: center;

                color: #ADA3EF;
                font-size: 14px;
                font-weight: 600;
              }
              
              .table-data:nth-of-type(2n) {
                background: rgba(90, 84, 153, 0.15);
              }

              .table-column {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1 1 0;
                text-transform: uppercase;
              }

              .table-column:nth-of-type(2n) {
                justify-content: flex-end;
              }

              .table-header p {
                background: rgba(90, 84, 153, 0.35);
                height: 25px;
                line-height: 25px;
                padding: 0 15px;
                border-radius: 2px;

                color: #ADA3EF;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
              }

              .range {
                -webkit-appearance: none;
                appearance: none;

                border-radius: 25px;
                background: #2B284E;
                max-width: 190px;
                height: 9px;

                //margin-right: auto;
              }

              .range::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 15px;
                height: 15px;
                background: white;
                cursor: pointer;
                border-radius: 50%;
              }

              .range::-moz-range-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 15px;
                height: 15px;
                background: white;
                cursor: pointer;
                border-radius: 50%;
              }
              
              .link {
                width: 70px;
                height: 25px;
              }
              
              .unlink {
                width: 70px;
                height: 25px;

                outline: unset;
                border: unset;
                
                cursor: pointer;

                color: #FFF;
                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 12px;
                font-weight: 700;
                
                border-radius: 3px;
                background: #E85959;
                box-shadow: 0px 1px 0px 0px #AF2525, 0px -1px 0px 0px #FF7A7A;
              }
              
              @media only screen and (max-width: 1000px) {
                .settings-container {
                  padding-bottom: 90px;
                }
              }
            `}</style>
        </>
    );
}

export default Settings;
