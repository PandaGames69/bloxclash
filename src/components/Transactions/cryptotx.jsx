import {authedAPI, createNotification} from "../../util/api";
import {formatNumber} from "../../util/numbers";

function CryptoTX(props) {

  return (
    <>
      <div className='tx'>
        <div className='symbol'>
          {props?.status === 'pending' && (
            <img class='cancel' src='/assets/icons/trash.svg' height='15' width='14' alt='cancel' onClick={async () => {
              let res = await authedAPI(`/trading/crypto/withdraw/cancel/${props?.id}`, 'POST', null, true)

              if (res.success) {
                props?.cancel(props?.id)
                createNotification('success', `Successfully cancelled your ${props?.currency} transaction.`)
              }
            }}/>
          )}
          <p className='gold bold'>{props?.currency}</p>
          {props?.txId && (
            <a className='txid white' href={props?.explorers[props?.chain]?.replace('{id}', props?.txId)} target='_blank'>
              TX ID
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M9.89791 5.46596H9.12101C8.96011 5.46596 8.82967 5.5964 8.82967 5.7573V9.2994C8.82967 9.48741 8.67666 9.64038 8.48865 9.64038H1.70025C1.51228 9.64038 1.35939 9.48741 1.35939 9.2994V2.51111C1.35939 2.32306 1.51228 2.17005 1.70025 2.17005H5.42372C5.58461 2.17005 5.71506 2.03961 5.71506 1.87872V1.10182C5.71506 0.940927 5.58461 0.810486 5.42372 0.810486H1.70025C0.762613 0.810486 -0.000183105 1.5734 -0.000183105 2.51111V9.29944C-0.000183105 10.2372 0.762652 11 1.70025 11H8.48862C9.42633 11 10.1892 10.2371 10.1892 9.29944V5.75734C10.1892 5.5964 10.0588 5.46596 9.89791 5.46596Z"
                  fill="white"/>
                <path
                  d="M10.7084 0H7.61818C7.45729 0 7.32684 0.130441 7.32684 0.291336V1.06823C7.32684 1.22913 7.45729 1.35957 7.61818 1.35957H8.6788L4.68769 5.3506C4.57391 5.46438 4.57391 5.64881 4.68769 5.76263L5.23703 6.31201C5.29169 6.36667 5.36576 6.39735 5.44306 6.39735C5.52033 6.39735 5.59444 6.36667 5.64906 6.31201L9.64017 2.3209V3.38148C9.64017 3.54238 9.77061 3.67282 9.93151 3.67282H10.7084C10.8693 3.67282 10.9997 3.54238 10.9997 3.38148V0.291336C10.9997 0.130441 10.8693 0 10.7084 0Z"
                  fill="white"/>
              </svg>
            </a>
          )}
        </div>

        <div>
          <p>{new Date(props.createdAt)?.toLocaleString()}</p>
        </div>

        <div>
          <img src='/assets/icons/coin.svg' height='17' width='17' alt=''/>
          <p className='white bold'>{formatNumber(props?.robuxAmount)}</p>
          <p class='white bold'>(<span class='gold'>$</span> {formatNumber(props?.fiatAmount)})</p>
        </div>

        <div>
          <p className={`status ${props?.status}`}>{props?.status}</p>
        </div>
      </div>

      <style jsx>{`
        .tx {
          width: 100%;
          min-height: 55px;

          padding: 16px 20px;

          display: flex;
          align-items: center;
          flex-wrap: wrap;

          background: rgba(90, 84, 153, 0.27);

          color: #ADA3EF;
          font-size: 14px;
          font-weight: 600;
          
          gap: 8px 0;
          overflow: hidden;
        }

        .tx div {
          flex: 1 1 0;
          display: flex;
          gap: 8px;
          justify-content: center;
          align-items: center;
          white-space: nowrap;
        }

        .symbol {
          display: flex;
          justify-content: flex-start !important;
          align-items: center;
          gap: 8px;
        }
        
        .txid {
          display: flex;
          gap: 4px;
        }

        .cancel {
          cursor: pointer;
        }

        .tx div:nth-of-type(5n) {
          justify-content: flex-end;
        }

        .status {
          text-transform: uppercase;
          color: #FCA31E;
        }

        .completed {
          text-transform: uppercase;
          color: #24DD4C;
        }

        .failed, .cancelled {
          color: #E85959;
          text-transform: uppercase;
        }
      `}</style>
    </>
  );
}

export default CryptoTX;
