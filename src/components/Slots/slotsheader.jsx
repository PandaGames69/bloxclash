import {useUser} from "../../contexts/usercontextprovider";
import {useSearchParams} from "@solidjs/router";
import {createSignal, onCleanup} from "solid-js";

function useDebounce(signalSetter, delay) {
  let timerHandle;
  function debouncedSignalSetter(value) {
    clearTimeout(timerHandle);
    timerHandle = setTimeout(() => signalSetter(value), delay);
  }
  onCleanup(() => clearInterval(timerHandle));
  return debouncedSignalSetter;
}

function SlotsHeader(props) {

  const [searchParams, setSearchParams] = useSearchParams()
  const [user] = useUser()

  const [search, setSearch] = createSignal(searchParams.search || '');
  const debouncedSetSlotName = useDebounce(setSearchParams, 300);

  function handleInputChange(e) {
    const value = e.target.value;
    setSearch(value);
    debouncedSetSlotName({ search: value });
  }

  return (
    <>
      <>
        <div class='slots-header'>
          <div class='slots-header-container'>
            <div class='search'>
              <h1><img src='/assets/icons/slot.svg' height='28' width='28' alt=''/> SLOTS</h1>
              <input type='text' placeholder='SEARCH FOR A SLOT...' value={search()} onInput={handleInputChange}/>

              <div class='mascot'>
                <img src='/assets/art/mascot.png' height='178' width='178'/>
                <div class='message'>
                  <p>Hey there, {user() && (<><span class='gold'>{user()?.username}</span>.</>)} I see you found our slots section. Use the search bar to find your preferred slots, and don’t worry, we’re adding a lot more providers soon.</p>
                </div>
              </div>
            </div>

            <div class='art'>
              <img src='/assets/art/gates.gif' width='291' height='475' alt='' class='gate'/>
              <img src='/assets/art/sweet.gif' width='162' height='162' alt='' class='sweet'/>
            </div>

            <img src='/assets/art/slotsbg.png' width='642' height='277' alt='' class='bg'/>
          </div>
        </div>

        <div class='header-spacer'/>
      </>

      <style jsx>{`

        .slots-header {
          width: 100%;
          height: 225px;

          background: linear-gradient(0deg, rgba(45, 41, 107, 0.15) 0%, rgba(45, 41, 107, 0.15) 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.00) 94.55%), radial-gradient(60% 60% at 50% 50%, rgba(147, 126, 236, 0.15) 0%, rgba(102, 83, 184, 0.15) 100%);
          box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.10), 0px 0.5px 0px 0px #6B59BA, 0px -0.5px 0px 0px #A08AFF;
          backdrop-filter: blur(4px);

          padding: 0 25px;

          position: absolute;
          left: 0;
          top: 0;
          z-index: 0;
          
          overflow: hidden;
        }

        .slots-header-container {
          max-width: 1175px;
          width: 100%;
          height: 100%;
          margin: 0 auto;

          display: flex;
          align-items: center;

          position: relative;
        }

        .slots-header-container .bg {
          position: absolute;
          margin: 0 auto;
          right: 0;
          left: 0;
          bottom: 0;

          opacity: 0.25;
          z-index: -1;

          mask-image: linear-gradient(to right, rgba(0, 0, 0, 0.01) 10%, black 80%, rgba(0, 0, 0, 0.01) 90%);
          user-select: none;
        }

        .search {
          height: 100%;

          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 20px;

          position: relative;
        }

        .search h1 {
          color: #FFF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 28px;
          font-weight: 800;

          display: flex;
          gap: 10px;
          align-items: center;

          margin: unset;
        }

        .search input {
          width: 400px;
          height: 50px;

          outline: unset;
          border: unset;

          border-radius: 8px;
          border: 1px solid rgba(134, 111, 234, 0.15);
          background: linear-gradient(0deg, rgba(64, 57, 118, 0.65) 0%, rgba(64, 57, 118, 0.65) 100%), radial-gradient(60% 60% at 50% 50%, rgba(147, 126, 236, 0.35) 0%, rgba(102, 83, 184, 0.35) 100%);
          box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.10);

          color: white;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 16px;
          font-weight: 700;

          padding: 0 15px;
        }

        .search input::placeholder {
          color: #9189D3;
        }

        .mascot {
          position: absolute;
          right: -50px;
          bottom: 0;
        }

        .message {
          position: absolute;
          top: 0;
          left: 150px;

          width: 382px;
          padding: 16px 16px 16px 30px;

          background: url("/assets/art/chatbubble.png") no-repeat;
          background-size: cover;

          color: #FFF;
          text-align: center;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 15px;
          font-weight: 500;

          z-index: 2;
        }

        .art {
          position: absolute;
          right: 0;
          bottom: 0;

          height: 100%;
          width: 291px;
          overflow: hidden;
        }

        .gate {
          position: absolute;
          z-index: 1;
          right: 0;
          bottom: -200px;
        }

        .sweet {
          position: absolute;
          z-index: 0;
          left: -30px;
        }

        .header-spacer {
          height: 225px;
        }

        @media only screen and (max-width: 950px) {
          .art {
            display: none;
          }
        }

        @media only screen and (max-width: 850px) {
          .slots-header-container {
            justify-content: center;
          }

          .message {
            display: none;
          }
        }

        @media only screen and (max-width: 600px) {
          .mascot {
            display: none;
          }

          .search {
            width: 100%;
            justify-content: center;
            align-items: center;
          }

          .search input {
            max-width: 400px;
            width: 100%;
          }
          
          .slots-header-container .bg {
            margin: unset;
            right: unset;
            left: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

export default SlotsHeader;
