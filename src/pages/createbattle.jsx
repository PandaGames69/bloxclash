import {A, useNavigate} from "@solidjs/router";
import CaseButton from "../components/Cases/casebutton";
import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI} from "../util/api";
import AddCases from "../components/Battles/addcases";
import {Title} from "@solidjs/meta";

function CreateBattle(props) {

    let slider
    const navigate = useNavigate()
    const [players, setPlayers] = createSignal('1v1')
    const [gamemode, setGamemode] = createSignal('standard')
    const [isPrivate, setIsPrivate] = createSignal(false)
    const [minLevel, setMinLevel] = createSignal(0, {equals: false})
    const [discount, setDiscount] = createSignal(0)

    const [addCases, setAddCases] = createSignal(false)
    const [addedCases, setAddedCases] = createSignal([])
    const [groupedCases, setGroupedCases] = createSignal([])
    const [total, setTotal] = createSignal(0)

    const [cases, {mutate}] = createResource(fetchCases)
    async function fetchCases() {
        try {
            let cases = await authedAPI('/cases', 'GET', null)
            return mutate(cases)
        } catch (e) {
            console.log(e)
            return mutate([])
        }
    }

    function parseNumber(num, setFunction) {
        if (typeof num !== 'number' || isNaN(num)) return setFunction(0)
        if (num >= 100) return setFunction(100)
        if (num <= 0) return setFunction(0)
        setFunction(num)
    }

    function createTrail() {
        let value = (slider.value - 0) / 100 * 100
        slider.style.background = 'linear-gradient(to right, #5F5CA6 0%, #5F5CA6 ' + value + '%, #2B284E ' + value + '%, #2B284E 100%)'
    }

    function addCase(caseToAdd, num) {
        if (num > 0 && addedCases().length >= 50) return
        if (num < 0) {
            let index = addedCases().findIndex(c => c.id === caseToAdd.id)
            if (index < 0) return

            setAddedCases([...addedCases().slice(0, index), ...addedCases().slice(index + 1)])
            setTotal(addedCases()?.reduce((pv, c) => pv + c.price, 0))
            return setGroupedCases(groupByIdAndSumAmount(addedCases()))
        }
        setAddedCases([...addedCases(), caseToAdd])
        setTotal(addedCases()?.reduce((pv, c) => pv + c.price, 0))
        return setGroupedCases(groupByIdAndSumAmount(addedCases()))
    }

    function groupByIdAndSumAmount(objects) {
        const groupedObjects = {}
        const orderOfIds = []

        objects.forEach(obj => {
            if (!groupedObjects[obj.id]) {
                groupedObjects[obj.id] = { ...obj, amount: 1 }
                orderOfIds.push(obj.id)
            } else {
                groupedObjects[obj.id].amount += 1
            }
        });

        return orderOfIds.map(id => groupedObjects[id])
    }

    function getAmount(id) {
        return groupedCases()?.find(c => c.id === id)?.amount || 0
    }

    function groupedCasesToIDArray() {
        let cases = []
        for (let c of groupedCases()) {
            let ids = new Array(c.amount).fill(c.id)
            cases.push(...ids)
        }
        return cases
    }

    function numberOfTeams() {
        if (players() === '2v2') { return 2 }
        if (players() === '1v1v1v1') { return 4 }
        if (players() === '1v1v1') { return 3 }
        if (players() === '1v1') { return 2 }
    }

    function getPlayersPerTeam() {
        if (players() === '2v2') { return 2 }
        return 1
    }

    function changePlayers(newPlayers) {
        if (newPlayers === '2v2' && gamemode() === 'group') setGamemode('standard')
        setPlayers(newPlayers)
    }

    function changeGamemode(newGamemode) {
        if (newGamemode === 'group' && players() === '2v2') return
        setGamemode(newGamemode)
    }

    function entryPrice() {
        return total() - (total() * (discount() / 100))
    }

    function realCost() {
        let fundingAmount = total() * (discount() / 100) * ((numberOfTeams() * getPlayersPerTeam()) - 1)
        return total() + fundingAmount

    }

    return (
        <>
            <Title>BloxClash | Create a Battle</Title>

            <Show when={!cases.loading} fallback={<></>}>
                {addCases() && (
                    <AddCases total={total()} selected={addedCases().length} cases={cases()} getAmount={getAmount} addedCases={addedCases()} close={() => setAddCases(false)} addCase={addCase}/>
                )}
            </Show>

            <div class='create-battle-container fadein'>
                <div class='header'>
                    <div class='header-section'>
                        <button class='back bevel-light'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="5" height="8" viewBox="0 0 5 8" fill="none">
                                <path
                                    d="M0.4976 4.00267C0.4976 3.87722 0.545618 3.75178 0.641454 3.65613L3.65872 0.646285C3.85066 0.454819 4.16185 0.454819 4.35371 0.646285C4.54556 0.837673 4.4976 1.00269 4.4976 1.33952L4.4976 4.00267L4.4976 6.50269C4.4976 7.00269 4.54547 7.16764 4.35361 7.35902C4.16175 7.55057 3.85056 7.55057 3.65863 7.35902L0.641361 4.34921C0.545509 4.25352 0.4976 4.12808 0.4976 4.00267Z"
                                    fill="#ADA3EF"/>
                            </svg>
                            <p>BACK</p>
                            <A href='/battles' class='gamemode-link'></A>
                        </button>

                        <p class='title'>
                            <img src='/assets/icons/battles.svg' height='18' alt=''/>
                            BATTLE CREATION
                        </p>
                    </div>

                    <div class='header-section'>
                        <p class='state'>{props?.battle ? 'Waiting for Players...' : ''}</p>
                    </div>

                    <div class='header-section'>
                        <div class='num-cases'>
                            <img src='/assets/icons/cases_explosion.svg' height='16' alt=''/>
                            <p>{addedCases()?.length || 0} <span>CASES</span></p>
                        </div>

                        <div class='cost'>
                            <img src='/assets/icons/coin.svg' height='16' alt=''/>
                            <span>
                                {realCost()?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        <button class='bevel-gold create' onClick={async () => {

                            let teams = numberOfTeams()
                            let playersPerTeam = getPlayersPerTeam()

                            if (gamemode() === 'group') {
                                playersPerTeam = teams
                                teams = 1
                            }

                            let res = await authedAPI('/battles/create', 'POST', JSON.stringify({
                                cases: groupedCasesToIDArray(),
                                teams: teams,
                                playersPerTeam: playersPerTeam,
                                gamemode: gamemode(),
                                funding: discount(),
                                minLvl: minLevel(),
                                isPrivate: isPrivate()
                            }), true)

                            if (res.success) {
                                let link = `/battle/${res?.battleId}`
                                if (res?.privKey) {
                                    link += `?pk=${res?.privKey}`
                                }
                                navigate(link)
                            }
                        }}>CREATE CASE</button>
                    </div>
                </div>

                <div class='bar'/>

                <div class='cases'>
                    <button class='add-case' onClick={() => setAddCases(!addCases())}>
                        <div class='plus'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="14" viewBox="0 0 17 14"
                                 fill="none">
                                <path
                                    d="M6.16963 13.085V9.05882H1.00592C0.335306 9.05882 0 8.76398 0 8.17429V5.82571C0 5.25635 0.335306 4.97168 1.00592 4.97168H6.16963V0.915032C6.16963 0.305011 6.48258 0 7.10848 0H9.82446C10.4727 0 10.7968 0.305011 10.7968 0.915032V4.97168H15.9941C16.6647 4.97168 17 5.25635 17 5.82571V8.17429C17 8.76398 16.6647 9.05882 15.9941 9.05882H10.7968V13.085C10.7968 13.695 10.4727 14 9.82446 14H7.10848C6.48258 14 6.16963 13.695 6.16963 13.085Z"
                                    fill="white"/>
                            </svg>
                        </div>

                        <p>ADD CASE</p>
                    </button>

                    <For each={groupedCases()}>{(c, index) => <CaseButton creator={true} addCase={() => addCase(c, 1)} removeCase={() => addCase(c, -1)} amount={c?.amount || 0} c={c}/>}</For>
                </div>

                <div class='bar'/>

                <div class='settings-section'>
                    <div class='settings-title'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 20 15" fill="none">
                            <path
                                d="M20 13.6364C20 13.8775 19.9042 14.1087 19.7337 14.2792C19.5632 14.4497 19.332 14.5455 19.0909 14.5455H8.18182C7.94071 14.5455 7.70948 14.4497 7.53899 14.2792C7.36851 14.1087 7.27273 13.8775 7.27273 13.6364C7.27273 12.1897 7.8474 10.8023 8.87033 9.77942C9.89325 8.75649 11.2806 8.18182 12.7273 8.18182H14.5455C15.9921 8.18182 17.3795 8.75649 18.4024 9.77942C19.4253 10.8023 20 12.1897 20 13.6364ZM13.6364 0C12.9172 0 12.2141 0.213269 11.6161 0.612838C11.0181 1.01241 10.552 1.58033 10.2768 2.24479C10.0016 2.90925 9.92956 3.6404 10.0699 4.34578C10.2102 5.05117 10.5565 5.69911 11.0651 6.20766C11.5736 6.71622 12.2216 7.06255 12.9269 7.20286C13.6323 7.34317 14.3635 7.27115 15.0279 6.99593C15.6924 6.7207 16.2603 6.25462 16.6599 5.65662C17.0595 5.05862 17.2727 4.35557 17.2727 3.63636C17.2727 2.67194 16.8896 1.74702 16.2077 1.06507C15.5257 0.383116 14.6008 0 13.6364 0ZM5.45455 0C4.73534 0 4.03229 0.213269 3.43429 0.612838C2.83629 1.01241 2.37021 1.58033 2.09498 2.24479C1.81976 2.90925 1.74774 3.6404 1.88805 4.34578C2.02836 5.05117 2.37469 5.69911 2.88325 6.20766C3.3918 6.71622 4.03974 7.06255 4.74513 7.20286C5.45051 7.34317 6.18166 7.27115 6.84612 6.99593C7.51058 6.7207 8.0785 6.25462 8.47807 5.65662C8.87764 5.05862 9.09091 4.35557 9.09091 3.63636C9.09091 2.67194 8.70779 1.74702 8.02584 1.06507C7.34389 0.383116 6.41897 0 5.45455 0ZM5.45455 13.6364C5.45319 12.6815 5.64132 11.7358 6.00804 10.8541C6.37475 9.97243 6.91277 9.17228 7.59091 8.5C7.03594 8.29047 6.44775 8.18269 5.85455 8.18182H5.05455C3.71473 8.18422 2.43049 8.71752 1.4831 9.66492C0.535706 10.6123 0.00240325 11.8966 0 13.2364V13.6364C0 13.8775 0.0957789 14.1087 0.266267 14.2792C0.436754 14.4497 0.667985 14.5455 0.909091 14.5455H5.61818C5.51234 14.2539 5.457 13.9465 5.45455 13.6364Z"
                                fill="#FCA31E"/>
                        </svg>

                        <p>PLAYERS</p>
                    </div>

                    <button class={'setting ' + (players() === '1v1' ? 'active' : '')}
                            onClick={() => changePlayers('1v1')}>
                        1v1
                    </button>
                    <button class={'setting ' + (players() === '1v1v1' ? 'active' : '')}
                            onClick={() => changePlayers('1v1v1')}>
                        1v1v1
                    </button>
                    <button class={'setting ' + (players() === '1v1v1v1' ? 'active' : '')}
                            onClick={() => changePlayers('1v1v1v1')}>
                        1v1v1v1
                    </button>

                    <button disabled={gamemode() === 'group'} class={'setting ' + (players() === '2v2' ? 'active' : '')}
                            onClick={() => changePlayers('2v2')}>
                        2v2
                    </button>
                </div>

                <div class='settings-section'>
                    <div class='settings-title'>
                        <img src='/assets/icons/cube.svg' height='19' width='17'/>

                        <p>GAMEMODE</p>
                    </div>

                    <button class={'setting ' + (gamemode() === 'standard' ? 'active' : '')}
                            onClick={() => changeGamemode('standard')}>
                        STANDARD
                    </button>
                    <button class={'setting ' + (gamemode() === 'crazy' ? 'active' : '')}
                            onClick={() => changeGamemode('crazy')}>
                        CRAZY MODE
                    </button>
                    <button disabled={players() === '2v2'} class={'setting ' + (gamemode() === 'group' ? 'active' : '')}
                            onClick={() => changeGamemode('group')}>
                        GROUP MODE
                    </button>
                </div>

                <div class='settings-section'>
                    <div class='settings-title'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 20 15" fill="none">
                            <path
                                d="M20 13.6364C20 13.8775 19.9042 14.1087 19.7337 14.2792C19.5632 14.4497 19.332 14.5455 19.0909 14.5455H8.18182C7.94071 14.5455 7.70948 14.4497 7.53899 14.2792C7.36851 14.1087 7.27273 13.8775 7.27273 13.6364C7.27273 12.1897 7.8474 10.8023 8.87033 9.77942C9.89325 8.75649 11.2806 8.18182 12.7273 8.18182H14.5455C15.9921 8.18182 17.3795 8.75649 18.4024 9.77942C19.4253 10.8023 20 12.1897 20 13.6364ZM13.6364 0C12.9172 0 12.2141 0.213269 11.6161 0.612838C11.0181 1.01241 10.552 1.58033 10.2768 2.24479C10.0016 2.90925 9.92956 3.6404 10.0699 4.34578C10.2102 5.05117 10.5565 5.69911 11.0651 6.20766C11.5736 6.71622 12.2216 7.06255 12.9269 7.20286C13.6323 7.34317 14.3635 7.27115 15.0279 6.99593C15.6924 6.7207 16.2603 6.25462 16.6599 5.65662C17.0595 5.05862 17.2727 4.35557 17.2727 3.63636C17.2727 2.67194 16.8896 1.74702 16.2077 1.06507C15.5257 0.383116 14.6008 0 13.6364 0ZM5.45455 0C4.73534 0 4.03229 0.213269 3.43429 0.612838C2.83629 1.01241 2.37021 1.58033 2.09498 2.24479C1.81976 2.90925 1.74774 3.6404 1.88805 4.34578C2.02836 5.05117 2.37469 5.69911 2.88325 6.20766C3.3918 6.71622 4.03974 7.06255 4.74513 7.20286C5.45051 7.34317 6.18166 7.27115 6.84612 6.99593C7.51058 6.7207 8.0785 6.25462 8.47807 5.65662C8.87764 5.05862 9.09091 4.35557 9.09091 3.63636C9.09091 2.67194 8.70779 1.74702 8.02584 1.06507C7.34389 0.383116 6.41897 0 5.45455 0ZM5.45455 13.6364C5.45319 12.6815 5.64132 11.7358 6.00804 10.8541C6.37475 9.97243 6.91277 9.17228 7.59091 8.5C7.03594 8.29047 6.44775 8.18269 5.85455 8.18182H5.05455C3.71473 8.18422 2.43049 8.71752 1.4831 9.66492C0.535706 10.6123 0.00240325 11.8966 0 13.2364V13.6364C0 13.8775 0.0957789 14.1087 0.266267 14.2792C0.436754 14.4497 0.667985 14.5455 0.909091 14.5455H5.61818C5.51234 14.2539 5.457 13.9465 5.45455 13.6364Z"
                                fill="#FCA31E"/>
                        </svg>

                        <p>PRIVACY</p>
                    </div>

                    <button class={'setting ' + (!isPrivate() ? 'active' : '')} onClick={() => setIsPrivate(false)}>
                        PUBLIC
                    </button>
                    <button class={'setting ' + (isPrivate() ? 'active' : '')} onClick={() => setIsPrivate(true)}>
                        PRIVATE
                    </button>
                    <div class='input-setting'>
                        <p>MIN LVL</p>
                        <input type='number' value={minLevel()}
                               onChange={(e) => parseNumber(e.target.valueAsNumber, setMinLevel)}/>
                    </div>
                </div>

                <div class='settings-section'>
                    <div class='settings-title'>
                        <img src='/assets/icons/coin.svg' height='17' width='17'/>

                        <p>FUNDING</p>
                    </div>

                    <input ref={slider} type='range' class='range' value={discount()}
                           onInput={(e) => {
                               setDiscount(e.target.valueAsNumber)
                               createTrail()
                           }}
                    />

                    <p class='coin-text'>
                        YOU PAY
                        <img src='/assets/icons/coin.svg' height='15' width='15' alt=''/>
                        <span class='white'>
                            {realCost()?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </p>

                    <p class='coin-text'>
                        OTHERS PAY
                        <img src='/assets/icons/coin.svg' height='15' width='15' alt=''/>
                        <span class='white'>
                            {entryPrice()?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </p>

                    <div class='input-setting'>
                        <p>DISCOUNT</p>
                        <span>
                            <input type='number' value={discount()}
                                   onChange={(e) => {
                                       parseNumber(e.target.valueAsNumber, setDiscount)
                                       createTrail()
                                   }}
                                   max="100" min="0" step="1"/>
                            <p class='white'>%</p>
                        </span>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .create-battle-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                display: flex;
                flex-direction: column;
                gap: 25px;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }

              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
              }

              .header-section {
                display: flex;
                align-items: center;
                gap: 15px;
                justify-content: center;
              }

              .title {
                color: #FFF;
                font-size: 18px;
                font-weight: 700;

                display: flex;
                align-items: center;
                gap: 8px;
              }

              .header-section:first-child {
                justify-content: flex-start;
              }

              .header-section:last-child {
                justify-content: flex-end;
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

              .total {
                color: #ADA3EF;
                font-size: 15px;
                font-weight: 700;
              }

              .num-cases {
                height: 30px;
                padding: 0 10px;
                border-radius: 2px;
                background: rgba(90, 84, 153, 0.35);

                display: flex;
                align-items: center;
                gap: 6px;

                color: #FFF;
                font-size: 14px;
                font-weight: 600;
              }

              .num-cases span {
                color: #ADA3EF;
                font-size: 11px;
                font-weight: 600;
              }

              .create {
                height: 30px;
                width: 130px;
              }

              .cost {
                height: 30px;
                font-size: 14px;
                padding: 0 10px;
                min-width: 100px;
                gap: 6px;
                font-variant-numeric: tabular-nums;
              }

              .cost p {
                margin-top: -2px;
              }

              .bar {
                width: 100%;
                height: 1px;
                background: #5A5499;
              }

              .cases {
                padding: 15px;
                background: rgba(90, 84, 153, 0.27);
                border-radius: 8px;

                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                grid-gap: 12px;
              }

              .add-case {
                outline: unset;
                border: unset;
                cursor: pointer;

                height: 230px;
                background: linear-gradient(200deg, rgba(75, 72, 135, 0), rgba(75, 72, 135, 0), rgba(75, 72, 135, 0.06), rgba(75, 72, 135, 1));
                border-radius: 10px;

                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                gap: 10px;

                color: #AEA4E4;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 13px;
                font-weight: 600;
                z-index: 0;

                position: relative;
              }

              .add-case:before {
                width: calc(100% - 2px);
                height: calc(100% - 2px);
                position: absolute;
                content: '';
                background: #322D59;
                top: 1px;
                left: 1px;
                border-radius: 10px;
                z-index: -1;
              }

              .plus {
                width: 70px;
                height: 70px;

                display: flex;
                align-items: center;
                justify-content: center;

                border-radius: 10px;
                background: linear-gradient(220deg, rgba(75, 72, 135, 0), rgba(75, 72, 135, 0), rgba(75, 72, 135, 0.06), rgba(75, 72, 135, 1));
                position: relative;
                z-index: 0;
              }

              .plus:before {
                width: 68px;
                height: 68px;
                position: absolute;
                content: '';
                background: linear-gradient(0deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.45) 100%), radial-gradient(385.21% 305.21% at 3.46% 224.40%, rgba(156, 78, 255, 0.35) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(222deg, rgba(69, 65, 122, 0.65) 0%, rgba(43, 40, 80, 0.00) 100%), rgba(0, 0, 0, 0.5);
                top: 1px;
                left: 1px;
                border-radius: 10px;
                z-index: -1;
              }

              .settings-section {
                outline: unset;
                border: unset;

                width: 100%;
                height: 45px;

                border-radius: 5px;
                background: linear-gradient(90deg, rgb(104, 100, 164) -49.01%, rgba(90, 84, 149, 0.34) -5.08%, rgba(66, 53, 121, 0) 90.28%);

                color: #ADA3EF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 15px;
                font-weight: 600;
                border-bottom: 2px solid transparent;

                padding: 0 15px;
                display: flex;
                align-items: center;
                gap: 20px;
              }
              
              .nomargin {
                margin-right: unset !important;
              }

              .settings-title {
                display: flex;
                align-items: center;
                gap: 12px;

                color: #FFF;
                font-size: 18px;
                font-weight: 700;

                margin-right: auto;
              }

              .setting {
                border: unset;
                outline: unset;
                background: unset;

                height: 100%;
                padding: unset;
                cursor: pointer;

                color: #ADA3EF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 15px;
                font-weight: 600;
                border-bottom: 2px solid transparent;

                transition: color .3s, border .3s;
              }
              
              .setting:disabled {
                opacity: 0.5;
                cursor: default;
              }

              .input-setting {
                display: flex;
                gap: 8px;

                color: #ADA3EF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 15px;
                font-weight: 600;
              }

              .input-setting span {
                display: flex;
                align-items: center;
                gap: 0;
              }

              .input-setting input {
                border: unset;
                outline: unset;
                background: unset;

                height: 100%;
                max-width: 30px;
                padding: unset;

                color: white;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 15px;
                font-weight: 600;
                text-align: right;

                transition: color .3s, border .3s;
              }

              .setting.active {
                color: #FCA31E;
                border-bottom: 2px solid #FCA31E;
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

              .coin-text {
                display: flex;
                align-items: center;
                gap: 6px;
                font-variant-numeric: tabular-nums;
              }

              @media only screen and (max-width: 1000px) {
                .create-battle-container {
                  padding-bottom: 90px;
                }
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

export default CreateBattle;
