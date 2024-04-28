import {createResource, createSignal, Show} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";
import Loader from "../Loader/loader";
import AdminMFA from "../MFA/adminmfa";
import Switch from "../Toggle/switch";

function AdminSettings(props) {

    const [settings, { mutate: mutateSettings, refetch: refetchSettings }] = createResource(fetchSettings)

    async function fetchSettings() {
        try {
            let settingsRes = await authedAPI(`/admin/features`, 'GET', null)
            if (settingsRes.error && settingsRes.error === '2FA_REQUIRED') {
                return mutateSettings({ mfa: true })
            }

            return mutateSettings(settingsRes)
        } catch (e) {
            console.log(e)
            return mutateSettings(null)
        }
    }

    async function changeProperty(id, value) {
        let newSettings = {...settings()}
        newSettings[id] = value
        mutateSettings(newSettings)

        let res = await authedAPI(`/admin/features/${id}`, 'POST', JSON.stringify({
            enable: value
        }), true)

        if (res.success) {
            return createNotification('success', `Successfully changed ${id} to ${value}`)
        }

        newSettings = {...settings()}
        newSettings[id] = !value
        mutateSettings(newSettings)
    }

    return (
        <>
            {settings()?.mfa && (
                <AdminMFA refetch={() => refetchSettings()}/>
            )}

            <Show when={!settings.loading} fallback={<Loader/>}>
                <div className='settings'>
                    <div class='section'>
                        <p class='title'>GAMES</p>
                        <diu class='toggles'>
                            <div class='toggle'>
                                <p>CRASH</p>
                                <Switch ultradark={true} active={settings()?.crash} toggle={() => {
                                    changeProperty('crash', !settings()?.crash)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>ROULETTE</p>
                                <Switch ultradark={true} active={settings()?.roulette} toggle={() => {
                                    changeProperty('roulette', !settings()?.roulette)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>CASES</p>
                                <Switch ultradark={true} active={settings()?.cases} toggle={() => {
                                    changeProperty('cases', !settings()?.cases)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>BATTLES</p>
                                <Switch ultradark={true} active={settings()?.battles} toggle={() => {
                                    changeProperty('battles', !settings()?.battles)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>COINFLIP</p>
                                <Switch ultradark={true} active={settings()?.coinflip} toggle={() => {
                                    changeProperty('coinflip', !settings()?.coinflip)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>JACKPOT</p>
                                <Switch ultradark={true} active={settings()?.jackpot} toggle={() => {
                                    changeProperty('jackpot', !settings()?.jackpot)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>SLOTS</p>
                                <Switch ultradark={true} active={settings()?.slots} toggle={() => {
                                    changeProperty('slots', !settings()?.slots)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>MINES</p>
                                <Switch ultradark={true} active={settings()?.mines} toggle={() => {
                                    changeProperty('mines', !settings()?.mines)
                                }}/>
                            </div>
                        </diu>
                    </div>

                    <div className='section'>
                        <p className='title'>DEPOSITS</p>
                        <diu className='toggles'>
                            <div className='toggle'>
                                <p>ROBUX</p>
                                <Switch ultradark={true} active={settings()?.robuxDeposits} toggle={() => {
                                    changeProperty('robuxDeposits', !settings()?.robuxDeposits)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>LIMITEDS</p>
                                <Switch ultradark={true} active={settings()?.limitedDeposits} toggle={() => {
                                    changeProperty('limitedDeposits', !settings()?.limitedDeposits)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>CRYPTO</p>
                                <Switch ultradark={true} active={settings()?.cryptoDeposits} toggle={() => {
                                    changeProperty('cryptoDeposits', !settings()?.cryptoDeposits)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>FIAT</p>
                                <Switch ultradark={true} active={settings()?.fiatDeposits} toggle={() => {
                                    changeProperty('fiatDeposits', !settings()?.fiatDeposits)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>CREDIT CARD</p>
                                <Switch ultradark={true} active={settings()?.cardDeposits} toggle={() => {
                                    changeProperty('cardDeposits', !settings()?.cardDeposits)
                                }}/>
                            </div>
                        </diu>
                    </div>

                    <div className='section'>
                        <p className='title'>WITHDRAWS</p>
                        <diu className='toggles'>
                            <div className='toggle'>
                                <p>ROBUX</p>
                                <Switch ultradark={true} active={settings()?.robuxWithdrawals} toggle={() => {
                                    changeProperty('robuxWithdrawals', !settings()?.robuxWithdrawals)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>LIMITEDS</p>
                                <Switch ultradark={true} active={settings()?.limitedWithdrawals} toggle={() => {
                                    changeProperty('limitedWithdrawals', !settings()?.limitedWithdrawals)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>CRYPTO</p>
                                <Switch ultradark={true} active={settings()?.cryptoWithdrawals} toggle={() => {
                                    changeProperty('cryptoWithdrawals', !settings()?.cryptoWithdrawals)
                                }}/>
                            </div>
                        </diu>
                    </div>

                    <div className='section'>
                        <p className='title'>SITE</p>
                        <diu className='toggles'>
                            <div className='toggle'>
                                <p>CHAT</p>
                                <Switch ultradark={true} active={settings()?.chat} toggle={() => {
                                    changeProperty('chat', !settings()?.chat)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>AFFILIATES</p>
                                <Switch ultradark={true} active={settings()?.affiliates} toggle={() => {
                                    changeProperty('affiliates', !settings()?.affiliates)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>LEADERBOARD</p>
                                <Switch ultradark={true} active={settings()?.leaderboard} toggle={() => {
                                    changeProperty('leaderboard', !settings()?.leaderboard)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>PROMOCODES</p>
                                <Switch ultradark={true} active={settings()?.promoCodes} toggle={() => {
                                    changeProperty('promoCodes', !settings()?.promoCodes)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>RAIN</p>
                                <Switch ultradark={true} active={settings()?.rain} toggle={() => {
                                    changeProperty('rain', !settings()?.rain)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>RAKEBACK</p>
                                <Switch ultradark={true} active={settings()?.rakeback} toggle={() => {
                                    changeProperty('Rakeback', !settings()?.rakeback)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>TIPS</p>
                                <Switch ultradark={true} active={settings()?.tips} toggle={() => {
                                    changeProperty('tips', !settings()?.tips)
                                }}/>
                            </div>

                            <div className='toggle'>
                                <p>SURVEYS</p>
                                <Switch ultradark={true} active={settings()?.surveys} toggle={() => {
                                    changeProperty('surveys', !settings()?.surveys)
                                }}/>
                            </div>
                        </diu>
                    </div>
                </div>
            </Show>

            <style jsx>{`
              .settings {
                display: flex;
                flex-direction: column;
                gap: 25px;
              }
              
              .section {
                display: flex;
                flex-direction: column;
                gap: 20px;
              }
              
              .title {
                color: #ADA3EF;
                font-size: 18px;
                font-weight: 700;
              }
              
              .toggles {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
              }
              
              .toggle {
                width: 180px;
                height: 90px;
                
                border-radius: 8px;
                border: 1px solid rgba(176, 155, 236, 0.25);
                background: linear-gradient(277deg, rgba(19, 17, 41, 0.25) -69.8%, rgba(37, 31, 78, 0.25) 144.89%);
                
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;

                color: #FFF;
                font-size: 14px;
                font-weight: 700;
                
                gap: 16px;
              }
            `}</style>
        </>
    );
}

export default AdminSettings;
