import {createSignal, For} from "solid-js";
import CaseButton from "../Cases/casebutton";
import {getCents} from "../../util/balance";

function AddCases(props) {

  const [search, setSearch] = createSignal('')
  const [sort, setSort] = createSignal('DESCENDING')

  function sortedCases() {
    if (!Array.isArray(props?.cases)) return []
    let sorted

    if (sort() === "DESCENDING")
      sorted = props?.cases.sort((a, b) => b.price - a.price)
    else
      sorted = props?.cases.sort((a, b) => a.price - b.price)

    sorted = sorted.filter(c => {
      return c?.name?.toLowerCase()?.includes(search().toLowerCase())
    })

    return sorted
  }

  return (
    <>
      <div class='modal fadein' onClick={() => props.close()}>
        <div class='cases-container' onClick={(e) => e.stopPropagation()}>
          <div class='header'>
            <button class='exit bevel-light' onClick={() => props.close()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M3.9497 0.447999L5.21006 1.936L6.45216 0.447999C6.68353 0.149333 6.95752 0 7.27413 0H9.6122C9.79486 0 9.90445 0.0533333 9.94099 0.16C9.9897 0.256 9.95925 0.362666 9.84966 0.48L6.79921 3.968L9.88619 7.52C9.99578 7.63733 10.0262 7.74933 9.97752 7.856C9.94099 7.952 9.83139 8 9.64873 8H6.96361C6.68353 8 6.40954 7.85067 6.14163 7.552L4.863 6.048L3.58438 7.552C3.31647 7.85067 3.04857 8 2.78067 8H0.351272C0.180788 8 0.071191 7.952 0.0224814 7.856C-0.0262283 7.74933 0.00421525 7.63733 0.113812 7.52L3.27385 3.936L0.296473 0.48C0.186876 0.362666 0.150344 0.256 0.186876 0.16C0.235586 0.0533333 0.351272 0 0.533933 0H3.10946C3.42607 0 3.70615 0.149333 3.9497 0.447999Z"
                  fill="#ADA3EF"/>
              </svg>
            </button>

            <p class='title'><img src='/assets/icons/battles.svg' height='20' alt=''/>CASE
              SELECTION</p>

            <div class='inputs'>
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

              <div class='search-container'>
                <input class='search' type='text' placeholder='SEARCH FOR CASES' value={search()}
                       onInput={(e) => setSearch(e.target.value)}/>

                <button class='search-button'>
                  <img src='/assets/icons/search.svg' alt=''/>
                </button>
              </div>

            </div>
          </div>

          <div class='cases'>
            <For each={sortedCases()}>{(c, index) =>
              <CaseButton
                creator={true}
                addCase={() => props.addCase(c, 1)}
                removeCase={() => props.addCase(c, -1)}
                amount={props.getAmount(c.id)}
                c={c}
              />
            }</For>
          </div>

          <div class='footer'>
            <div class='selected info'>
              <p>SELECTED <span class='white'>{props.selected || 0}</span>/50</p>
            </div>

            <div class='info'>
              <p>TOTAL AMOUNT</p>
            </div>

            <div class='cost'>
              <img src='/assets/icons/coin.svg' height='16' alt=''/>
              <p>{Math.floor(props?.total)}<span class='gray'>.{getCents(props?.total)}</span></p>
            </div>

            <div class='bar'/>

            <button class='bevel-gold done' onClick={() => props?.close()}>DONE</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal {
          position: fixed;
          top: 0;
          left: 0;

          width: 100vw;
          height: 100vh;

          background: rgba(24, 23, 47, 0.55);
          cubic-bezier(0, 1, 0, 1);

          display: flex;
          align-items: center;
          justify-content: center;

          z-index: 1000;
        }

        .cases-container {
          max-width: 1010px;
          width: 100%;
          height: 100%;
          max-height: 650px;
          background: #2C2952;

          display: flex;
          flex-direction: column;
          border-radius: 16px;
          overflow: hidden;
        }

        .header, .footer {
          width: 100%;
          min-height: 70px;

          display: flex;
          align-items: center;
          gap: 10px;

          padding: 0 20px;

          background: #322F5F;
        }

        .footer {
          min-height: 60px;
        }

        .info {
          height: 30px;
          padding: 0 10px;

          border-radius: 2px;
          background: rgba(90, 84, 153, 0.35);
          line-height: 30px;

          color: #ADA3EF;
          font-size: 11px;
          font-weight: 600;
        }

        .selected {
          margin-right: auto;
        }

        .cost {
          height: 30px;
          padding: 0 7px;
        }

        .done {
          height: 30px;
          width: 95px;
        }

        .bar {
          height: 13px;
          width: 1px;
          background: #534F96;
          margin: 0 10px;
        }

        .exit {
          width: 25px;
          height: 25px;
          background: rgba(85, 76, 125, 1);

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .title {
          color: #FFF;
          font-size: 20px;
          font-weight: 700;

          display: flex;
          align-items: center;
          gap: 12px;

          margin-right: auto;
        }

        .cases {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          grid-gap: 15px;
          flex: 1;
          overflow-y: scroll;
          padding: 20px;
          scrollbar-color: transparent transparent;
        }

        .cases::-webkit-scrollbar {
          display: none;
        }

        .inputs {
          display: flex;
          gap: 10px;
        }

        .search-container {
          width: 198px;
          height: 40px;

          border-radius: 3px;
          background: rgba(0, 0, 0, 0.12);

          padding: 0 0 0 15px;

          display: flex;
        }

        .search {
          width: 100%;
          height: 100%;
          background: unset;
          border: unset;
          outline: unset;

          color: #ADA3EF;
          font-size: 12px;
          font-family: Geogrotesque Wide, sans-serif;
          font-weight: 600;
        }

        .search::placeholder {
          color: #ADA3EF;
          font-size: 12px;
          font-family: Geogrotesque Wide, sans-serif;
          font-weight: 600;
        }

        .search-button {
          outline: unset;
          border: unset;
          cursor: pointer;

          width: 40px;
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

export default AddCases;
