import {For} from "solid-js";

function Bundle(props) {

  function getRarity(price) {
    if (price < 1000) {
      return 'gray'
    } else if (price < 10000) {
      return 'blue'
    } else if (price < 50000) {
      return 'pink'
    } else if (price < 250000) {
      return 'red'
    }
    return 'gold'
  }

  function addPrefix(num) {
    if (num > 0) return '+'
    return ''
  }

  return (
    <>
      <div class={'limited-item-container ' + (props?.active ? 'active' : '')} onClick={props?.click}>

        <p
          className='name'>{props?.items?.length > 1 ? `${props?.items?.length} Item bundle` : props?.items[0]?.name}</p>

        <div class='items'>
          <For each={props?.items}>{(item, index) =>
            <div className={'item-content ' + (props?.items?.length > 1 ? 'small ' : '') + (getRarity(item?.price || 0))}>
              {(props?.items?.length <= 1 && item.discount !== 0) && (
                <p class={'discount ' + (-item.discount > 0 ? 'red' : '')}>{addPrefix(-item.discount)}{-item.discount}%</p>
              )}

              <img src={item.img} height='75' alt='' draggable={false}/>
            </div>
          }</For>
        </div>

        <div class='horz'>
          <img src='/assets/icons/coin.svg' height='12' alt=''/>
          <p>{props?.price?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }) || '0.00'}</p>
        </div>
      </div>

      <style jsx>{`
        .limited-item-container {
          min-height: 170px;
          height: 170px;

          min-width: 142px;

          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          border-radius: 8px;
          z-index: 0;
          padding: 12px;

          border: 1px solid #524C93;
          background: linear-gradient(228deg, rgba(67, 64, 120, 0.65) 0%, rgba(55, 47, 104, 0.65) 100%);
          box-shadow: 0px 2px 15px 0px rgba(0, 0, 0, 0.10);

          cursor: pointer;
          transition: all .2s;
          user-select: none;
        }

        .active {
          border: 1px solid #FCA31E;
          background: linear-gradient(0deg, rgba(255, 190, 24, 0.25) 0%, rgba(255, 190, 24, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
          box-shadow: 0px 2px 15px 0px rgba(0, 0, 0, 0.10);
        }

        .active .name {
          color: white;
        }

        .gray {
          background: linear-gradient(45deg, rgba(169, 181, 210, 1), rgba(169, 181, 210, 0) 70%);
        }

        .blue {
          background: linear-gradient(45deg, rgba(65, 118, 255, 1), rgba(65, 118, 255, 0) 70%);
        }

        .pink {
          background: linear-gradient(45deg, rgba(220, 95, 222, 1), rgba(220, 95, 222, 0) 70%);
        }

        .red {
          background: linear-gradient(45deg, rgba(255, 81, 65, 1), rgba(255, 81, 65, 0) 70%);
        }

        .gold {
          background: linear-gradient(45deg, rgba(255, 153, 1, 1), rgba(255, 153, 1, 0) 70%);
        }

        .item-content:before {
          position: absolute;
          content: '';
          border-radius: 8px;
          z-index: -1;
          background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(169, 181, 210, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #312C5A;
          top: 1px;
          left: 1px;
          width: calc(100% - 2px);
          height: calc(100% - 2px);
        }

        .blue:before {
          background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(65, 118, 255, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #312C5A;
        }

        .pink:before {
          background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(220, 95, 222, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #312C5A;
        }

        .red:before {
          background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(255, 81, 65, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #493534;
        }

        .gold:before {
          background: radial-gradient(144.25% 102.12% at 53.73% -2.06%, rgba(252, 164, 33, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #312C5A;
        }

        .items {
          width: 100%;
          height: 100%;

          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(55px, 1fr));
          grid-gap: 4px;

          max-width: 114px;
        }

        .item-content {
          display: flex;
          align-items: center;
          justify-content: center;

          position: relative;
          z-index: 0;

          width: 100%;
          height: 80px;

          border-radius: 8px;
          padding: 12px;
        }

        .item-content.small {
          width: unset;
          height: 37px;
        }

        .small img {
          height: 28px;
        }

        .name {
          color: #ADA3EF;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
        }

        .horz {
          display: flex;
          align-items: center;
          gap: 8px;

          color: #FFF;
          font-size: 13px;
          font-weight: 700;
        }
        
        .discount {
          position: absolute;
          top: 0;
          right: 0;

          padding: 0 4px;
          height: 20px;
          line-height: 20px;
          
          border-radius: 6.25px 0;
          background: linear-gradient(0deg, rgba(89, 232, 120, 0.35) 0%, rgba(89, 232, 120, 0.35) 100%), linear-gradient(130deg, rgba(86, 83, 154, 0.41) 27.25%, rgba(70, 67, 124, 0.41) 103.79%);

          color: #59E878;
          font-family: "Geogrotesque Wide", sans-serif;
          font-size: 10px;
          font-weight: 700;
        }
        
        .discount.red {
          background: rgba(232, 89, 89, 0.15);
          color: #E85959;
        }
      `}</style>
    </>
  );
}

export default Bundle;
