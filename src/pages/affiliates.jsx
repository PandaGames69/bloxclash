import {createEffect, createResource, createSignal, For, onCleanup, Show} from "solid-js";
import {useWebsocket} from "../contexts/socketprovider";
import {useUser} from "../contexts/usercontextprovider";
import Avatar from "../components/Level/avatar";
import {getCents} from "../util/balance";
import {api, authedAPI, createNotification} from "../util/api";
import Loader from "../components/Loader/loader";
import Pagination from "../components/Pagination/pagination";
import {useSearchParams} from "@solidjs/router";
import {addPage} from "../util/pagination";
import {Title} from "@solidjs/meta";

function Affiliates(props) {

    let linkRef
    let loadedPages = new Set()
    const [users, setUsers] = createSignal([], { equals: false })
    const [total, setTotal] = createSignal(1)
    const [page, setPage] = createSignal(1)
    const [isLoading, setIsLoading] = createSignal(true)
    const [totalRef, setTotalRef] = createSignal(0)

    const [searchParams, setSearchParams] = useSearchParams()

    const [code, setCode] = createSignal(null)
    const [tempCode, setTempCode] = createSignal('')

    const [affiliates, { mutate: mutateAffiliates }] = createResource(fetchStats)

    async function fetchStats() {
        try {
            setPage(+searchParams?.page || 1)
            let aff = await authedAPI('/user/affiliate', 'GET', null)
            let users = await authedAPI(`/user/affiliate/users?page=${page()}`, 'GET', null)

            if (aff.affiliateCode) {
                setCode(aff.affiliateCode)
                setTempCode(aff.affiliateCode)
            }

            if (users) {
                loadedPages.add(page())
                addPage(users.data, page(), setUsers)
                setTotal(users.pages)
                setIsLoading(false)
                setTotalRef(users.total || 0)
            }

            return mutateAffiliates(aff)
        } catch (e) {
            console.log(e)
            return mutateAffiliates(null)
        }
    }

    async function loadPage() {
        if (isLoading()) return
        setIsLoading(true)
        setSearchParams({ page: page() })

        let moreData = await authedAPI(`/user/affiliate/users?page=${page()}`, 'GET', null)
        if (!moreData) return setIsLoading(false)

        addPage(moreData.data, page(), setUsers)
        setTotalRef(moreData.total)
        setTotal(moreData.pages)
        loadedPages.add(page())

        setIsLoading(false)
    }

    function copyAffLink() {
        navigator.clipboard.writeText(`https://bloxclash.com/?a=${code()}`);
    }

    return (
        <>
            <Title>BloxClash | Affiliates</Title>

            <div class='affiliate-container fadein'>
                <div class='affiliate-banner'>
                    <img class='art' src='/assets/art/greenswiggle.png' width='380' height='86'/>
                    <img class='art right' src='/assets/art/greenswiggle.png' width='380' height='86'/>

                    <img class='coin' src='/assets/icons/coin.svg' width='100' height='88'/>
                    <img class='coin two' src='/assets/icons/coinreverse.png' width='53' height='57'/>
                    <img class='coin three' src='/assets/icons/coin.svg' width='96' height='86'/>
                    <img class='coin four' src='/assets/icons/coinreverse.png' width='63' height='68'/>

                    <h1 class='title'>AFFILIATES</h1>
                    <p class='desc'>
                        INVITE PEOPLE TO BLOXCLASH TO <span class='greengradient'>EARN 10%</span> ON ALL REFERRAL WAGERS!
                        THE MORE THE USER YOU REFER WAGERS, THE MORE <span class='greengradient'>YOU EARN!</span>
                    </p>
                </div>

                <div class='bar'/>

                <Show when={!affiliates.loading} fallback={<Loader/>}>
                    <>
                        <div class='stats'>
                            <div class='stat'>
                                <p>{totalRef() || 0}</p>
                                <p>TOTAL REFERRALS</p>
                            </div>

                            <div class='stat'>
                                <p class='white align'>
                                    <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                                    {(affiliates()?.totalWagered || 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>

                                <p>TOTAL WAGERED</p>
                            </div>

                            <div class='stat'>
                                <p class='white align'>
                                    <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                                    {(affiliates()?.totalEarnings || 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>

                                <p>TOTAL EARNINGS</p>
                            </div>

                            <div class='stat green horz'>
                                <div>
                                    <p class='white align'>
                                        <img src='/assets/icons/coin.svg' height='21' width='21' alt=''/>
                                        {(affiliates()?.unclaimedEarnings || 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>

                                    <p class='green'>CLAIM EARNINGS</p>
                                </div>

                                <button class='claim' onClick={async () => {
                                    if (affiliates()?.unclaimedEarnings < affiliates()?.minClaim) {
                                        return createNotification('error', `You need a minimum of ${affiliates()?.minClaim} Robux to claim your affiliates.`)
                                    }

                                    let res = await authedAPI('/user/affiliate/claim', 'POST', null, true)

                                    if (res.success) {
                                        createNotification('success', 'Successfully claimed your affiliate earnings.')

                                        let newAffiliates = {...affiliates()}
                                        newAffiliates.unclaimedEarnings = 0

                                        mutateAffiliates(newAffiliates)
                                    }
                                }}>
                                    CLAIM
                                </button>
                            </div>
                        </div>

                        <div class='settings'>
                            <div class='setting'>
                                <p class='tag'>YOUR REFERRAL LINK</p>
                                <p ref={linkRef}>{code() ? `https://bloxclash.com/?a=${code()}` : `You haven't set a referral code yet!`}</p>

                                <button class='copy' onClick={() => copyAffLink()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16">
                                        <path d="M8.62259 2.2981H1.52163C0.681259 2.2981 0 2.97936 0 3.81974V13.964C0 14.8043 0.681259 15.4856 1.52163 15.4856H8.62259C9.46297 15.4856 10.1442 14.8043 10.1442 13.964V3.81974C10.1442 2.97936 9.46297 2.2981 8.62259 2.2981Z"/>
                                        <path d="M13.1876 1.79089V11.9351C13.1864 12.3383 13.0257 12.7246 12.7406 13.0097C12.4555 13.2948 12.0692 13.4555 11.666 13.4567H11.1588V3.81974C11.1588 3.14713 10.8916 2.50208 10.416 2.02647C9.94036 1.55087 9.2953 1.28368 8.6227 1.28368H3.13467C3.23932 0.987696 3.43295 0.731325 3.68902 0.549713C3.9451 0.368101 4.25107 0.270139 4.56501 0.269257H11.666C12.0692 0.270461 12.4555 0.431162 12.7406 0.716263C13.0257 1.00136 13.1864 1.3877 13.1876 1.79089Z"/>
                                    </svg>
                                </button>
                            </div>

                            <div class='setting'>
                                <p class='tag'>SET YOUR  REFERRAL CODE</p>
                                <input type='text' placeholder='Create an referral code...' value={tempCode()} onInput={(e) => setTempCode(e.target.value)}/>
                                <button class='bevel-gold change' onClick={async () => {
                                    let res = await authedAPI('/user/affiliate/code', 'POST', JSON.stringify({
                                        code: tempCode()
                                    }), true)

                                    if (res.success) {
                                        createNotification('success', `Successfully changed your referral code to ${tempCode()}`)
                                        setCode(tempCode())
                                    }
                                }}>CHANGE</button>
                            </div>
                        </div>

                        <div class='bar'/>

                        <div class='table-header'>
                            <div class='table-column'>
                                <p>PLAYER</p>
                            </div>

                            <div class='table-column'>
                                <p>DATE REFERRED</p>
                            </div>

                            <div class='table-column'>
                                <p>TOTAL WAGERED</p>
                            </div>

                            <div class='table-column'>
                                <p>EARNINGS</p>
                            </div>
                        </div>

                        <For each={users()[page()]}>{(aff, index) => (
                            <div class='table-data'>
                                <div class='table-column'>
                                    <Avatar id={aff?.id} xp={aff.xp} height='30'/>
                                    <p>{aff?.username || 'Anonymous'}</p>
                                </div>

                                <div class='table-column'>
                                    <p>{new Date(aff.affiliatedAt).toLocaleString()}</p>
                                </div>

                                <div class='table-column'>
                                    <img src='/assets/icons/coin.svg' height='15' width='16' alt=''/>
                                    <p class='white'>{(aff?.totalWagered || 0)?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</p>
                                </div>

                                <div class='table-column'>
                                    <p class='plus'>+</p>
                                    <img src='/assets/icons/coin.svg' height='15' width='16' alt=''/>
                                    <p class='white'>{(aff?.totalEarnings || 0).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</p>
                                </div>
                            </div>
                        )}</For>

                        <div class='bar'/>

                        <Pagination isLoading={isLoading()} loadedPages={loadedPages} loadPage={loadPage} page={page()} total={total()} setPage={setPage} setParams={setSearchParams}/>
                    </>
                </Show>
            </div>

            <style jsx>{`
              .affiliate-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }
              
              .affiliate-banner {
                width: 100%;
                height: 165px;

                border-radius: 8px;
                border: 1px dashed #0CFF07;
                background: radial-gradient(102.11% 102.11% at 50.00% 103.31%, rgba(68, 255, 76, 0.39) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.50) 0%, rgba(0, 0, 0, 0.40) 100%), linear-gradient(0deg, rgba(0, 26, 255, 0.10) 0%, rgba(0, 26, 255, 0.10) 100%), linear-gradient(0deg, rgba(2, 101, 0, 0.18) 0%, rgba(2, 101, 0, 0.18) 100%), radial-gradient(4404.69% 184.13% at 1.21% 0.00%, rgba(105, 245, 56, 0.60) 0%, rgba(0, 0, 0, 0.00) 100%), radial-gradient(7956.17% 242.63% at 105.07% -21.99%, rgba(0, 255, 71, 0.74) 0%, rgba(0, 0, 0, 0.00) 100%), #3920AB;
                
                display: flex;
                gap: 10px;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                
                position: relative;
              }
              
              .coin {
                position: absolute;
                left: -30px;
                bottom: 5px;
              }

              .coin.two {
                position: absolute;
                left: 36px;
                top: -10px;
              }

              .coin.three {
                position: absolute;
                left: unset;
                right: 14px;
                top: 5px;
              }

              .coin.four {
                position: absolute;
                left: unset;
                right: -18px;
                bottom: 5px;
                transform: rotate(30deg);
              }
              
              .art {
                position: absolute;
                left: 0;
              }
              
              .art.right {
                left: unset;
                right: 0;
                transform: rotate(180deg) scaleY(-1);
              }
              
              .title {
                background: linear-gradient(180deg, #0EFF18 0%, #74FF7A 44.93%, #0EFF18 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                
                text-align: center;
                font-family: "Rubik", sans-serif;
                font-size: 54px;
                font-weight: 900;
                filter: drop-shadow(0px 3px 0px rgba(0, 0, 0, 0.4));
              }
              
              .greengradient {
                background: linear-gradient(180deg, #0EFF18 0%, #74FF7A 44.93%, #0EFF18 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              
              h1 {
                margin: unset;
              }
              
              .desc {
                color: #FFF;
                text-align: center;
                font-family: "Rubik", sans-serif;
                font-size: 16px;
                font-weight: 700;
                max-width: 625px;
              }
              
              .bar {
                width: 100%;
                min-height: 1px;
                margin: 25px 0;
                background: #5A5499;
              }
              
              .stats {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }

              .stat {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                gap: 10px;

                flex: 1 1 0;
                height: 90px;

                border-radius: 5px;
                background: rgba(90, 84, 153, 0.27);

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 20px;
                font-weight: 600;

                padding: 10px 20px;
              }
              
              .stat.horz {
                flex-direction: row;
                gap: 20px;
              }
              
              .stat.green {
                background: rgba(89, 232, 120, 0.15);
              }

              .stat p:last-child {
                color: #ADA3EF;
                font-size: 13px;
                font-weight: 600;
              }
              
              .green {
                color: #59E878 !important;
              }
              
              .claim {
                outline: unset;
                border: unset;
                
                width: 70px;
                height: 30px;
                
                border-radius: 3px;
                background: #24DD4C;
                box-shadow: 0px 1px 0px 0px #308041, 0px -1px 0px 0px #88FFA2;

                color: #FFF;
                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 14px;
                font-weight: 700;
                
                cursor: pointer;
              }
              
              .claim:active {
                box-shadow: unset;
              }
              
              .align {
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .settings {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 20px;
              }
              
              .setting {
                flex: 1 1 0;
                height: 50px;

                border-radius: 5px;
                border: 1px solid #464075;
                background: rgba(0, 0, 0, 0.12);
                backdrop-filter: blur(4px);
                
                display: flex;
                align-items: center;
                padding: 0 12px;
                gap: 12px;

                color: #FFF;
                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 14px;
                font-weight: 500;
                
                white-space: nowrap;
              }
              
              .tag {
                height: 25px;
                padding: 0 10px;
                border-radius: 2px;
                background: rgba(90, 84, 153, 0.35);

                color: #ADA3EF;
                font-size: 12px;
                font-weight: 700;
                line-height: 25px;
                text-align: center;
              }
              
              .setting input {
                height: 100%;
                flex: 1;
                
                background: unset;
                outline: unset;
                border: unset;

                color: #FFF;
                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 14px;
                font-weight: 500;
              }
              
              .setting button {
                margin-left: auto;
              }
              
              .copy {
                border: unset;
                outline: unset;
                padding: unset;
                background: unset;
                cursor: pointer;
              }
              
              .copy svg {
                fill: #776EB0;
                transition: all .1s;
              }
              
              .copy:active svg {
                fill: #ADA3EF;
              }
              
              .change {
                height: 30px;
                padding: 0 10px;
              }
              
              .table-header, .table-data {
                display: flex;
                justify-content: space-between;
                margin: 20px 0;
              }
              
              .table-data {
                height: 55px;
                background: rgba(90, 84, 153, 0.35);
                padding: 0 20px;
                
                display: flex;
                align-items: center;

                color: #ADA3EF;
                font-size: 14px;
                font-weight: 700;
              }
              
              .table-column {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1 1 0;
              }
              
              .table-column:nth-of-type(4n) {
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
              }
              
              .plus {
                width: 17px;
                height: 17px;
                text-align: center;
                line-height: 17px;
                background: rgba(89, 232, 120, 0.15);
                color: #59E878;
                font-weight: 600;
                border-radius: 2px;
              }
              
              @media only screen and (max-width: 1000px) {
                .affiliates-container {
                  padding-bottom: 90px;
                }
              }
            `}</style>
        </>
    );
}

export default Affiliates;
