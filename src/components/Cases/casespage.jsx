import {createResource, createSignal, For, Show} from "solid-js";
import CaseButton from "./casebutton";
import Loader from "../Loader/loader";
import {authedAPI} from "../../util/api";

function Cases(props) {

    const [cases, {mutate}] = createResource(fetchCases)

    const [search, setSearch] = createSignal('')
    const [min, setMin] = createSignal(NaN)
    const [max, setMax] = createSignal(NaN)
    const [option, setOption] = createSignal('ALL')
    const [sort, setSort] = createSignal('DESCENDING')

    async function fetchCases() {
        try {
            let cases = await authedAPI('/cases', 'GET', null)
            return mutate(cases)
        } catch (e) {
            console.log(e)
            return mutate([])
        }
    }

    function sortedCases() {
        if (!Array.isArray(cases())) return []
        let sorted
        let realMax = isNaN(max()) ? Number.MAX_VALUE : max()
        let realMin = isNaN(min()) ? 0 : Math.max(0, min())

        if (sort() === "DESCENDING")
            sorted = cases().sort((a, b) => b.price - a.price)
        else
            sorted = cases().sort((a, b) => a.price - b.price)

        sorted = sorted.filter(c => {
            return c.price >= realMin && c.price <= realMax && c?.name?.toLowerCase()?.includes(search().toLowerCase())
        })

        return sorted
    }

    return (
        <>
            <div class='cases-container fadein'>
                <div class='filters'>
                    <p class='title'><img src='/assets/icons/cases_explosion.svg' height='20' alt=''/>CASES</p>

                    <div class='options'>
                        <button class={'option hide ' + (option() === 'ALL' ? 'active' : '')}
                                onClick={() => setOption('ALL')}>
                            ALL
                        </button>

                        <button class={'option hide ' + (option() === 'FEATURED' ? 'active' : '')}
                                onClick={() => setOption('FEATURED')} disabled={true}>
                            FEATURED
                        </button>

                        <button class={'option hide ' + (option() === 'NEW' ? 'active' : '')}
                                onClick={() => setOption('NEW')} disabled={true}>
                            NEW
                        </button>

                        <button class={'option hide ' + (option() === 'PARTNERS' ? 'active' : '')}
                                onClick={() => setOption('PARTNERS')} disabled={true}>
                            PARTNERS
                        </button>

                        <button class={'option hide ' + (option() === 'TRENDING' ? 'active' : '')}
                                onClick={() => setOption('TRENDING')} disabled={true}>
                            TRENDING
                        </button>
                    </div>

                    <div class='inputs'>
                        <div class='number-container small'>
                            <img src='/assets/icons/coin.svg' height='13' alt=''/>
                            <input class='number' type='number' placeholder='MIN PRICE...' value={min()} onInput={(e) => setMin(e.target.valueAsNumber)}/>
                        </div>

                        <div class='number-container small'>
                            <img src='/assets/icons/coin.svg' height='13' alt=''/>
                            <input class='number' type='number' placeholder='MAX PRICE...' value={max()} onInput={(e) => setMax(e.target.valueAsNumber)}/>
                        </div>

                        <div class='search-container'>
                            <input class='number' type='text' placeholder='SEARCH FOR CASES' value={search()} onInput={(e) => setSearch(e.target.value)}/>

                            <button class='search-button'>
                                <img src='/assets/icons/search.svg' alt=''/>
                            </button>
                        </div>

                        <button class={'sort-by tiny ' + (sort() === 'DESCENDING' ? 'flip' : '')}
                                onClick={() => setSort(sort() === 'DESCENDING' ? 'ASCENDING' : 'DESCENDING')}>
                            <p>SORT BY: <span class='gold'>{sort()}</span></p>

                            <svg class='arrow' width="7" height="5" viewBox="0 0 7 5" fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M3.50001 0.994671C3.62547 0.994671 3.7509 1.04269 3.84655 1.13852L6.8564 4.15579C7.04787 4.34773 7.04787 4.65892 6.8564 4.85078C6.66501 5.04263 6.5 4.99467 6.16316 4.99467L3.50001 4.99467L1 4.99467C0.5 4.99467 0.335042 5.04254 0.14367 4.85068C-0.0478893 4.65883 -0.0478893 4.34764 0.14367 4.1557L3.15347 1.13843C3.24916 1.04258 3.3746 0.994671 3.50001 0.994671Z"
                                    fill="#9489DB"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <Show when={!cases.loading} fallback={<Loader/>}>
                    <div class='cases'>
                        <For each={sortedCases()}>{(c, index) => <CaseButton creator={false} c={c}/>}</For>
                    </div>
                </Show>
            </div>

            <style jsx>{`
              .cases-container {
                width: 100%;
                height: fit-content;
              }

              .filters {
                width: 100%;
                height: 43px;

                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;

                padding: 0 0 0 15px;
                margin: 0 0 30px 0;

                border-radius: 8px;
                background: linear-gradient(90deg, rgba(90, 84, 149, 0.65) 0%, rgba(90, 84, 149, 0.45) 29.82%, rgba(66, 53, 121, 0) 100%);
              }

              .title {
                color: #FFF;
                font-size: 20px;
                font-weight: 700;

                display: flex;
                align-items: center;
                gap: 12px;
              }

              .options {
                height: 100%;
                display: flex;
                gap: 12px;
              }

              .option {
                line-height: 43px;
                cursor: pointer;
                height: 100%;

                background: unset;
                outline: unset;
                border: unset;

                font-family: "Geogrotesque Wide";
                color: #ADA3EF;
                font-size: 14px;
                font-weight: 700;

                transition: color .3s;
              }

              .option:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }

              .active {
                color: var(--gold);
                border-bottom: 2px solid var(--gold);
              }

              .cases {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                grid-gap: 15px;
              }

              .inputs {
                display: flex;
                gap: 10px;
              }

              .number-container {
                max-width: 120px;
                height: 30px;

                display: flex;
                align-items: center;
                gap: 10px;
                padding: 0 12px;

                border-radius: 3px;
                background: rgba(0, 0, 0, 0.15);
              }

              .number {
                width: 100%;
                height: 100%;
                background: unset;
                border: unset;
                outline: unset;

                color: #ADA3EF;
                font-size: 12px;
                font-family: Geogrotesque Wide;
                font-weight: 600;
              }

              .number::placeholder {
                color: #ADA3EF;
                font-size: 12px;
                font-family: Geogrotesque Wide;
                font-weight: 600;
              }

              .search-container {
                width: 198px;
                height: 30px;

                border-radius: 3px;
                background: rgba(0, 0, 0, 0.12);

                padding: 0 0 0 15px;

                display: flex;
              }

              .search-button {
                outline: unset;
                border: unset;
                cursor: pointer;

                width: 30px;
                border-radius: 0px 3px 3px 0px;
                background: rgba(0, 0, 0, 0.12);
              }

              .sort-by {
                width: 160px;

                font-family: Geogrotesque Wide;
                color: #ADA3EF;
                font-size: 12px;
                font-weight: 600;

                outline: unset;
                border: unset;

                display: flex;
                align-items: center;
                justify-content: center;

                border-radius: 3px;
                background: #423E76;
                box-shadow: 0px 1px 0px 0px #2E2855, 0px -1px 0px 0px #4B4783;
                cursor: pointer;

                gap: 8px;
              }
              
              .sort-by.flip svg {
                transform: rotate(180deg);
              }

              .sort-by p {
                margin-top: -2px;
              }

              @media only screen and (max-width: 1500px) {
                .hide {
                  display: none;
                }
              }

              @media only screen and (max-width: 830px) {
                .small {
                  display: none;
                }
              }

              @media only screen and (max-width: 560px) {
                .sort-by {
                  display: none;
                }
              }
            `}</style>
        </>
    );
}

export default Cases;
