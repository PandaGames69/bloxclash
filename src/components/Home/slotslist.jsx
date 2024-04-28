import {createResource, createSignal, For, Show} from "solid-js";
import {A} from "@solidjs/router";
import {api} from "../../util/api";
import Loader from "../Loader/loader";

function SlotsList() {

  let slotsRef
  const [slots, setSlots] = createSignal([])
  const [slotsInfo] = createResource(fetchSlots)

  async function fetchSlots() {
    try {
      let res = await api('/slots?limit=25', 'GET', null, false)
      if (!Array.isArray(res.data)) return

      setSlots(res.data)
      return res
    } catch (e) {
      console.error(e)
      return []
    }
  }

  function scrollGames(direction) {
    slotsRef.scrollBy({
      left: slotsRef.clientWidth * direction,
      behavior: 'smooth'
    })
  }

  return (
    <>
      <div class='games'>
        <div class='games-button'>
          <img src='/assets/icons/seven.svg' height='19' width='19' alt=''/>

          <p class='title'>
            <span class='white bold'>SLOTS</span> (<Show when={!slots.loading} fallback='0'>{slotsInfo()?.total || 0}</Show>)
          </p>

          <button class='bevel-purple viewall'>
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="7" viewBox="0 0 11 7" fill="none">
              <path d="M5.5 0C3.39833 0 1.49243 1.14984 0.0860693 3.01749C-0.0286898 3.1705 -0.0286898 3.38427 0.0860693 3.53728C1.49243 5.40718 3.39833 6.55702 5.5 6.55702C7.60167 6.55702 9.50757 5.40718 10.9139 3.53953C11.0287 3.38652 11.0287 3.17275 10.9139 3.01974C9.50757 1.14984 7.60167 0 5.5 0ZM5.65076 5.58719C4.25565 5.67495 3.10356 4.52511 3.19132 3.12775C3.26332 1.97566 4.19715 1.04183 5.34924 0.969827C6.74435 0.88207 7.89644 2.03191 7.80868 3.42927C7.73443 4.57911 6.8006 5.51294 5.65076 5.58719ZM5.58101 4.52061C4.82945 4.56786 4.2084 3.94906 4.2579 3.1975C4.29615 2.57645 4.80019 2.07467 5.42124 2.03416C6.1728 1.98691 6.79385 2.60571 6.74435 3.35727C6.70385 3.98057 6.19981 4.48236 5.58101 4.52061Z" fill="#423579"/>
            </svg>

            SEE ALL
            <A href='/slots' class='gamemode-link'/>
          </button>

          <div class='line'/>

          <button class='bevel-purple arrow' onClick={() => scrollGames(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M12 6L2 6M2 6L7.6 0.999999M2 6L7.6 11" stroke="white" stroke-width="2"/>
            </svg>
          </button>

          <button class='bevel-purple arrow' onClick={() => scrollGames(1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.58933e-07 6L10 6M10 6L4.4 11M10 6L4.4 0.999999" stroke="white" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <div class='slots' ref={slotsRef}>
          <Show when={!slots.loading} fallback={<Loader small={true}/>}>
            <For each={slots()}>{(slot, index) =>
              <div className='slot' style={{ 'background-image': `url(${import.meta.env.VITE_SERVER_URL}${slot.img})` }}>
                <A href={`/slots/${slot.slug}`} class='gamemode-link'/>
              </div>
            }</For>
          </Show>
        </div>
      </div>

      <style jsx>{`
        .games {
          width: 100%;
          margin-top: 30px;
        }

        .games-button {
          outline: unset;
          border: unset;

          width: 100%;
          height: 45px;

          border-radius: 5px;
          background: linear-gradient(90deg, rgb(104, 100, 164) -49.01%, rgba(90, 84, 149, 0.655) -5.08%, rgba(66, 53, 121, 0) 98.28%);

          padding: 0 15px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title {
          color: #ADA3EF;
          font-size: 18px;
          font-weight: 600;
          user-select: none;
          
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .title .bold {
          font-weight: 800;
          font-size: 22px;
        }
        
        .viewall {
          width: 70px;
          height: 25px;
          
          display: flex;
          align-items: center;
          gap: 4px;

          cursor: pointer;
          position: relative;

          color: rgba(66, 53, 121, 1);
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 11px;
          font-weight: 700;
        }

        .line {
          flex: 1;
          height: 1px;

          border-radius: 2525px;
          background: linear-gradient(90deg, #5A5499 0%, rgba(90, 84, 153, 0.00) 100%);
        }

        .slots {
          display: flex;
          gap: 8px;
          
          padding: 8px;
          margin-top: 15px;

          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.00);
          background: rgba(29, 24, 62, 0.15);

          min-height: 195px;
          overflow-x: auto;
        }
        
        .slots::-webkit-scrollbar {
          display: none;
        }

        .slot {
          min-width: 146px;
          width: 146px;
          height: 195px;
          border-radius: 6px;
          
          background-size: 100%;
          background-position: center;
          background-repeat: no-repeat;

          transition: background .3s;
          position: relative;
        }
        
        .slot:hover {
          background-size: 105%;
        }
        
        .arrow {
          width: 40px;
          height: 30px;

          display: flex;
          align-items: center;
          justify-content: center;
          
          cursor: pointer;
          margin-left: auto;
        }
      `}</style>
    </>
  );
}

export default SlotsList;
