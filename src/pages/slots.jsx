import SlotsHeader from "../components/Slots/slotsheader";
import {createResource, createSignal, For, Show} from "solid-js";
import {api} from "../util/api";
import Loader from "../components/Loader/loader";
import {A, useSearchParams} from "@solidjs/router";
import Bets from "../components/Home/bets";
import {useUser} from "../contexts/usercontextprovider";
import FancySlotBanner from "../components/Slots/fancyslotbanner";
import {Meta, Title} from "@solidjs/meta";

const sortingOptions = ['popularity', 'RTP', 'a-z', 'z-a']

function Slots(props) {

  let providersRef
  let [params, setParams] = useSearchParams()

  const [user] = useUser()
  const [slots, setSlots] = createSignal()
  const [fetching, setFetching] = createSignal(true)
  const [slotsData] = createResource(() => ({ sort: params.sort, provider: params.provider, search: params.search }), fetchSlots)
  const [providers] = createResource(fetchProviders)
  const [top] = createResource(fetchTopPicks)

  async function fetchSlots(params) {
    try {
      let sort = params.sort?.toLowerCase() || 'popularity'
      let prov = params.provider || ''
      let order = sort !== 'a-z' ? 'DESC' : 'ASC'
      let search = params.search || ''

      if (sort.includes('-')) sort = 'name'

      let res = await api(`/slots?sortOrder=${order}&sortBy=${sort}&provider=${prov}&search=${search}`, 'GET', null, false)
      if (!Array.isArray(res.data)) {
        setFetching(false)
        return
      }

      setSlots(res.data)
      setFetching(false)
      return res
    } catch (e) {
      console.error(e)
      setFetching(false)
      return []
    }
  }

  async function fetchTopPicks() {
    try {
      let res = await api(`/slots/featured`, 'GET', null, false)
      if (!Array.isArray(res)) return []

      return res
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async function fetchProviders() {
    try {
      let res = await api('/slots/providers', 'GET', null, false)
      if (!Array.isArray(res) || res.length < 1) return []
      return res
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async function fetchMoreSlots() {
    if (fetching()) return

    try {
      setFetching(true)

      let sort = params?.sort?.toLowerCase() || 'popularity'
      let order = params.sort !== 'a-z' ? 'DESC' : 'ASC'
      let provider = params?.provider || ''
      let search = params.search || ''

      if (sort.includes('-')) sort = 'name'

      let res = await api(`/slots?offset=${slots()?.length}&sortOrder=${order}&sortBy=${sort}&provider=${provider}&search=${search}`, 'GET', null, false)
      if (!Array.isArray(res.data)) {
        setFetching(false)
        return
      }

      setSlots([...slots(), ...res.data])
      setFetching(false)
    } catch (e) {
      console.error(e)
      setFetching(false)
      return []
    }
  }

  function repeatProviders() {
    if (!providers() || !Array.isArray(providers())) return []
    return Array(Math.ceil(6 / providers().length)).fill(providers()).flat() || []
  }

  function scrollProviders(direction) {
    providersRef.scrollBy({
      left: providersRef.clientWidth * direction,
      behavior: 'smooth'
    })
  }

  return (
    <>
      <Title>BloxClash | Slots</Title>
      <Meta name='title' content='Slots'></Meta>
      <Meta name='description' content='Play And Spin The Best Slots On BloxClash To Win Robux On Roblox Gaming!'></Meta>

      <div class='slots-base-container'>
        <SlotsHeader/>

        <div class='our-picks'>
          <div style={{ flex: 1, background: 'linear-gradient(270deg, #FF9901 0%, rgba(252, 163, 30, 0.00) 98.59%)', 'min-height': '1px' }}/>

          <p>
            <img src='/assets/icons/fire.svg' height='20' width='15'/>
            OUR TOP PICKS
          </p>

          <div style={{ flex: 1, background: 'linear-gradient(90deg, #FF9901 0%, rgba(252, 163, 30, 0.00) 98.59%)', 'min-height': '1px' }}/>
        </div>

        <div className='top-five'>
          <Show when={!top.loading}>
            <For each={top()}>{(slot) =>
              <FancySlotBanner {...slot}/>
            }</For>
          </Show>
        </div>

        <div class='bar' style={{ background: '#5A5499', width: '100%', 'min-height': '1px', margin: '0 0 20px 0' }}/>

        <div class='sort'>
          <div class='sorting-wrapper' onClick={(e) => e.currentTarget.classList.toggle('active')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="11" viewBox="0 0 17 11" fill="none">
              <path
                d="M5.40909 9.14006e-06C4.93082 0.00135331 4.46466 0.150597 4.07454 0.42728C3.68442 0.703962 3.38942 1.09454 3.23 1.54546H0.772727C0.567787 1.54546 0.371241 1.62688 0.226327 1.77179C0.0814121 1.9167 0 2.11325 0 2.31819C0 2.52313 0.0814121 2.71968 0.226327 2.86459C0.371241 3.00951 0.567787 3.09092 0.772727 3.09092H3.23C3.37176 3.49187 3.62108 3.8461 3.95068 4.11484C4.28028 4.38358 4.67745 4.55648 5.09873 4.6146C5.52001 4.67273 5.94917 4.61386 6.33923 4.44442C6.72929 4.27497 7.06522 4.0015 7.31027 3.65392C7.55531 3.30634 7.70002 2.89805 7.72856 2.47374C7.75709 2.04943 7.66836 1.62544 7.47207 1.24818C7.27577 0.870915 6.97948 0.554921 6.61562 0.334775C6.25177 0.114628 5.83436 -0.00118488 5.40909 9.14006e-06ZM16.2273 1.54546H10.0455C9.84051 1.54546 9.64397 1.62688 9.49905 1.77179C9.35414 1.9167 9.27273 2.11325 9.27273 2.31819C9.27273 2.52313 9.35414 2.71968 9.49905 2.86459C9.64397 3.00951 9.84051 3.09092 10.0455 3.09092H16.2273C16.4322 3.09092 16.6288 3.00951 16.7737 2.86459C16.9186 2.71968 17 2.52313 17 2.31819C17 2.11325 16.9186 1.9167 16.7737 1.77179C16.6288 1.62688 16.4322 1.54546 16.2273 1.54546ZM6.95454 6.95455H0.772727C0.567787 6.95455 0.371241 7.03597 0.226327 7.18088C0.0814121 7.3258 0 7.52234 0 7.72728C0 7.93222 0.0814121 8.12877 0.226327 8.27368C0.371241 8.4186 0.567787 8.50001 0.772727 8.50001H6.95454C7.15948 8.50001 7.35603 8.4186 7.50095 8.27368C7.64586 8.12877 7.72727 7.93222 7.72727 7.72728C7.72727 7.52234 7.64586 7.3258 7.50095 7.18088C7.35603 7.03597 7.15948 6.95455 6.95454 6.95455ZM16.2273 6.95455H13.77C13.5877 6.43898 13.229 6.00444 12.7574 5.72775C12.2857 5.45105 11.7314 5.35001 11.1924 5.44248C10.6534 5.53496 10.1645 5.81499 9.81201 6.23309C9.45954 6.65119 9.26621 7.18043 9.26621 7.72728C9.26621 8.27413 9.45954 8.80338 9.81201 9.22147C10.1645 9.63957 10.6534 9.9196 11.1924 10.0121C11.7314 10.1046 12.2857 10.0035 12.7574 9.72681C13.229 9.45012 13.5877 9.01558 13.77 8.50001H16.2273C16.4322 8.50001 16.6288 8.4186 16.7737 8.27368C16.9186 8.12877 17 7.93222 17 7.72728C17 7.52234 16.9186 7.3258 16.7737 7.18088C16.6288 7.03597 16.4322 6.95455 16.2273 6.95455Z"
                fill="#FCA31E"/>
            </svg>

            <p>
              Filter By: <span class='white'>Providers</span>
            </p>

            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="6" viewBox="0 0 9 6" fill="none">
              <path
                d="M4.50001 -5.60273e-07C4.66131 -5.74374e-07 4.82259 0.0719308 4.94557 0.215494L8.81537 4.73537C9.06154 5.02289 9.06154 5.48906 8.81537 5.77646C8.5693 6.06387 8.35714 5.99202 7.92407 5.99202L4.50002 5.99202L1.28571 5.99202C0.642858 5.99202 0.430769 6.06373 0.184718 5.77632C-0.0615712 5.48892 -0.0615712 5.02275 0.184718 4.73523L4.05446 0.215353C4.1775 0.0717678 4.33878 -5.46177e-07 4.50001 -5.60273e-07Z"
                fill="#9489DB"/>
            </svg>

            <div className='dropdown left' onClick={(e) => e.stopPropagation()}>
              <div className='filters'>
                <For each={providers()}>{(prov) =>
                  <div className={'option ' + (params.provider === prov.slug ? 'active' : '')}
                       onClick={() => setParams({ provider: params?.provider === prov.slug ? null : prov.slug })}>
                    <p>{prov.name}</p>
                    <div className='checkbox'>
                      <img src='/assets/icons/check.svg'/>
                    </div>
                  </div>
                }</For>
              </div>
            </div>
          </div>

          <div className='sorting-wrapper' onClick={(e) => e.currentTarget.classList.toggle('active')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="11" viewBox="0 0 17 11" fill="none">
              <path
                d="M5.40909 9.14006e-06C4.93082 0.00135331 4.46466 0.150597 4.07454 0.42728C3.68442 0.703962 3.38942 1.09454 3.23 1.54546H0.772727C0.567787 1.54546 0.371241 1.62688 0.226327 1.77179C0.0814121 1.9167 0 2.11325 0 2.31819C0 2.52313 0.0814121 2.71968 0.226327 2.86459C0.371241 3.00951 0.567787 3.09092 0.772727 3.09092H3.23C3.37176 3.49187 3.62108 3.8461 3.95068 4.11484C4.28028 4.38358 4.67745 4.55648 5.09873 4.6146C5.52001 4.67273 5.94917 4.61386 6.33923 4.44442C6.72929 4.27497 7.06522 4.0015 7.31027 3.65392C7.55531 3.30634 7.70002 2.89805 7.72856 2.47374C7.75709 2.04943 7.66836 1.62544 7.47207 1.24818C7.27577 0.870915 6.97948 0.554921 6.61562 0.334775C6.25177 0.114628 5.83436 -0.00118488 5.40909 9.14006e-06ZM16.2273 1.54546H10.0455C9.84051 1.54546 9.64397 1.62688 9.49905 1.77179C9.35414 1.9167 9.27273 2.11325 9.27273 2.31819C9.27273 2.52313 9.35414 2.71968 9.49905 2.86459C9.64397 3.00951 9.84051 3.09092 10.0455 3.09092H16.2273C16.4322 3.09092 16.6288 3.00951 16.7737 2.86459C16.9186 2.71968 17 2.52313 17 2.31819C17 2.11325 16.9186 1.9167 16.7737 1.77179C16.6288 1.62688 16.4322 1.54546 16.2273 1.54546ZM6.95454 6.95455H0.772727C0.567787 6.95455 0.371241 7.03597 0.226327 7.18088C0.0814121 7.3258 0 7.52234 0 7.72728C0 7.93222 0.0814121 8.12877 0.226327 8.27368C0.371241 8.4186 0.567787 8.50001 0.772727 8.50001H6.95454C7.15948 8.50001 7.35603 8.4186 7.50095 8.27368C7.64586 8.12877 7.72727 7.93222 7.72727 7.72728C7.72727 7.52234 7.64586 7.3258 7.50095 7.18088C7.35603 7.03597 7.15948 6.95455 6.95454 6.95455ZM16.2273 6.95455H13.77C13.5877 6.43898 13.229 6.00444 12.7574 5.72775C12.2857 5.45105 11.7314 5.35001 11.1924 5.44248C10.6534 5.53496 10.1645 5.81499 9.81201 6.23309C9.45954 6.65119 9.26621 7.18043 9.26621 7.72728C9.26621 8.27413 9.45954 8.80338 9.81201 9.22147C10.1645 9.63957 10.6534 9.9196 11.1924 10.0121C11.7314 10.1046 12.2857 10.0035 12.7574 9.72681C13.229 9.45012 13.5877 9.01558 13.77 8.50001H16.2273C16.4322 8.50001 16.6288 8.4186 16.7737 8.27368C16.9186 8.12877 17 7.93222 17 7.72728C17 7.52234 16.9186 7.3258 16.7737 7.18088C16.6288 7.03597 16.4322 6.95455 16.2273 6.95455Z"
                fill="#FCA31E"/>
            </svg>

            <p>
              Sort By: <span className='white'>{params.sort || 'Popularity'}</span>
            </p>

            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="6" viewBox="0 0 9 6" fill="none">
              <path
                d="M4.50001 -5.60273e-07C4.66131 -5.74374e-07 4.82259 0.0719308 4.94557 0.215494L8.81537 4.73537C9.06154 5.02289 9.06154 5.48906 8.81537 5.77646C8.5693 6.06387 8.35714 5.99202 7.92407 5.99202L4.50002 5.99202L1.28571 5.99202C0.642858 5.99202 0.430769 6.06373 0.184718 5.77632C-0.0615712 5.48892 -0.0615712 5.02275 0.184718 4.73523L4.05446 0.215353C4.1775 0.0717678 4.33878 -5.46177e-07 4.50001 -5.60273e-07Z"
                fill="#9489DB"/>
            </svg>

            <div class='dropdown' onClick={(e) => e.stopPropagation()}>
              <div class='filters'>
                <For each={sortingOptions}>{(sort) =>
                  <div className={'option ' + (params.sort === sort ? 'active' : '')}
                       onClick={() => setParams({ sort: sort })}>
                    <p>{sort}</p>
                    <div className='checkbox'>
                      <img src='/assets/icons/check.svg'/>
                    </div>
                  </div>
                }</For>
              </div>
            </div>
          </div>
        </div>

        <div className='slots'>
          <Show when={!slotsData.loading} fallback={<Loader/>}>
            <For each={slots()}>{(slot, index) =>
              <div className='slot'
                   style={{'background-image': `url(${import.meta.env.VITE_SERVER_URL}${slot.img})`}}>
                <A href={`/slots/${slot.slug}`} class='gamemode-link'/>
              </div>
            }</For>
          </Show>
        </div>

        <div class='pagination'>
          <p class='displaying'>DISPLAYING <span class='white'>{slots()?.length}</span> OUT
            OF {slotsData()?.total} SLOTS</p>

          <button class='bevel-purple load' onClick={() => fetchMoreSlots()}>
            LOAD MORE
          </button>
        </div>

        <div class='providers-wrapper'>
          <div className='banner'>
            <img src='/assets/icons/providers.svg' height='19' width='19' alt=''/>

            <p className='title'>
              <span className='white bold'>PROVIDERS</span>
            </p>

            <div className='line'/>

            <button className='bevel-purple arrow' onClick={() => scrollProviders(-1)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M12 6L2 6M2 6L7.6 0.999999M2 6L7.6 11" stroke="white" stroke-width="2"/>
              </svg>
            </button>

            <button className='bevel-purple arrow' onClick={() => scrollProviders(1)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1.58933e-07 6L10 6M10 6L4.4 11M10 6L4.4 0.999999" stroke="white" stroke-width="2"/>
              </svg>
            </button>
          </div>

          <div class='providers' ref={providersRef}>
            <For each={repeatProviders()}>{(provider, index) =>
              <div class='provider'>
                <img src={`${import.meta.env.VITE_SERVER_URL}${provider.img}`} height='50'/>
              </div>
            }</For>
          </div>
        </div>

        <Bets user={user()}/>
      </div>

      <style jsx>{`
        .slots-base-container {
          width: 100%;
          max-width: 1175px;
          height: fit-content;

          box-sizing: border-box;
          padding: 30px 0;
          margin: 0 auto;
        }
        
        .our-picks {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .our-picks p {
          height: 40px;
          padding: 0 16px;
          
          line-height: 40px;
          
          border-radius: 4.63px;
          border: 1.543px solid #B17818;
          background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(253deg, #1A0E33 -27.53%, #423C7A 175.86%);

          font-family: Geogrotesque Wide, sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--gold);
          
          filter: drop-shadow(0 0 15px rgba(252,163,30, 0.3));
          
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .top-five {
          gap: 15px;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          
          margin: 35px 0;
        }

        .sort {
          width: 100%;
          min-height: 50px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          
          padding: 8px 16px;

          border-radius: 8px;
          border: 1px solid rgba(134, 111, 234, 0.15);
          background: linear-gradient(0deg, rgba(64, 57, 118, 0.65) 0%, rgba(64, 57, 118, 0.65) 100%), radial-gradient(60% 60% at 50% 50%, rgba(147, 126, 236, 0.15) 0%, rgba(102, 83, 184, 0.15) 100%);
        }

        .sorting-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;

          position: relative;

          color: #9189D3;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 16px;
          font-weight: 600;
          
          cursor: pointer;
        }

        .sorting-wrapper p {
          margin-top: -2px;
          text-transform: capitalize;
        }
        
        .dropdown {
          position: absolute;
          right: 0;
          
          z-index: 2;
          top: 40px;

          width: 245px;
          display: none;
        }
        
        .dropdown.left {
          left: 0;
          right: unset;
        }
        
        .active .dropdown {
          display: block;
        }
        
        .filters {
          display: flex;
          flex-direction: column;
          gap: 8px;
          
          background: #26214A;
          border: 1px solid #3A336D;
          padding: 8px;
          
          width: 245px;
        }
        
        .option {
          width: 100%;
          max-width: 245px;
          height: 50px;
          
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          text-transform: capitalize;

          border-radius: 3px;
          border: 1px solid rgba(134, 111, 234, 0.15);
          background: rgba(64, 57, 118, 0.65);
        }
        
        .checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
          
          width: 30px;
          height: 30px;

          border-radius: 3px;
          border: 1px solid #494182;
          background: #342E5F;
          
          transition: all .3s;
        }
        
        .checkbox img {
          display: none;
        }
        
        .option.active .checkbox {
          border: 1px solid #59E878;
          background: rgba(89, 232, 120, 0.25);
        }
        
        .option.active .checkbox img {
          display: block;
        }

        .slots {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          grid-gap: 8px;

          margin-top: 20px;

          min-height: 195px;
          overflow-x: auto;
        }

        .slots::-webkit-scrollbar {
          display: none;
        }

        .slot {
          min-width: 130px;
          aspect-ratio: 146/195;
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

        .pagination {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;

          margin: 35px 0 50px 0;
        }

        .displaying {
          height: 45px;
          width: 100%;

          border-radius: 555px;
          background: radial-gradient(60% 60% at 50% 50%, rgba(147, 126, 236, 0.15) 0%, rgba(102, 83, 184, 0.15) 100%);
          box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.10);

          color: #9189D3;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 16px;
          font-weight: 600;
          line-height: 45px;

          text-align: center;
        }

        .load {
          width: 180px;
          height: 45px;

          color: #333061;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 15px;
          font-weight: 700;

          cursor: pointer;
        }

        .banner {
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

        .line {
          flex: 1;
          height: 1px;

          border-radius: 2525px;
          background: linear-gradient(90deg, #5A5499 0%, rgba(90, 84, 153, 0.00) 100%);
        }

        .arrow {
          margin-left: auto;
          
          width: 40px;
          height: 30px;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;
        }
        
        .providers {
          display: flex;
          gap: 10px;
          
          margin: 20px 0 50px 0;
          width: 100%;
          overflow: hidden;
        }
        
        .provider {
          min-width: 200px;
          height: 80px;
          
          display: flex;
          align-items: center;
          justify-content: center;
          
          border-radius: 8px;
          border: 1px solid rgba(134, 111, 234, 0.15);
          background: linear-gradient(0deg, rgba(64, 57, 118, 0.65) 0%, rgba(64, 57, 118, 0.65) 100%), radial-gradient(60% 60% at 50% 50%, rgba(147, 126, 236, 0.15) 0%, rgba(102, 83, 184, 0.15) 100%);

          cursor: pointer;
        }

        @media only screen and (max-width: 1000px) {
          .slots-base-container {
            padding-bottom: 90px;
          }
        }
      `}</style>
    </>
  );
}

export default Slots;
