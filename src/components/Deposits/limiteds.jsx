import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";
import {toast} from "solid-toast";
import Loader from "../Loader/loader";
import LimitedItem from "../Items/limiteditem";

function LimitedsDeposit(props) {

  const [robux, setRobux] = createSignal(0)
  const [items, {mutate}] = createResource(() => props?.refetch?.toString(), fetchInventory)

  async function fetchInventory() {
    try {
      let res = await authedAPI('/user/inventory', 'GET', null)
      if (!res || !Array.isArray(res)) return mutate(null)
      return mutate(res)
    } catch (e) {
      console.log(e)
      return mutate([])
    }
  }

  function isActive(item) {
    return props?.selected?.findIndex(i => i.userAssetId === item.userAssetId) !== -1
  }

  return (
    <>
      <div class='limiteds-deposit-container'>
        <div class='deposit-header'>
          <p class='type'>You have selected <span class='gold'>LIMITEDS</span></p>
        </div>

        <div class='bar' style={{margin: '15px 0'}}/>

        <div class='items'>
          <Show when={!items.loading} fallback={<Loader/>}>
            <For each={items()?.sort((a, b) => b.price - a.price)}>{(item, index) =>
              <LimitedItem price={item?.price} isOnHold={item?.isOnHold} img={item?.img} name={item?.name}
                           active={isActive(item)} click={() => props?.selectLimited(item)}/>
            }</For>
          </Show>
        </div>
      </div>

      <style jsx>{`
        .limiteds-deposit-container {
          width: 100%;
          height: fit-content;

          display: flex;
          flex-direction: column;
          align-items: center;

          padding: 25px 50px;
        }

        .deposit-header {
          display: flex;
          width: 100%;

          color: #ADA3EF;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 13px;
          font-weight: 600;

          gap: 8px;
        }

        .bar {
          width: 100%;
          height: 1px;
          min-height: 1px;
          background: #4B4887;
        }

        .type {
          margin-right: auto;
        }

        .items {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(142px, 1fr));
          grid-gap: 10px;

          width: 100%;
        }
      `}</style>
    </>
  );
}

export default LimitedsDeposit;
