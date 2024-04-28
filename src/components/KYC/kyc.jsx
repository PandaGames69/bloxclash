import {openSupport} from "../../util/support";

function KYCModal(props) {
  return (
    <>
      <div className='modal' onClick={() => props?.close()}>
        <div className='container' onClick={(e) => e.stopPropagation()}>
          <p className='close bevel-light' onClick={() => props?.close()}>X</p>

          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M12.6562 22.6875C5.67759 22.6875 0 28.3651 0 35.3438C0 42.3224 5.67759 48 12.6562 48C19.6349 48 25.3125 42.3224 25.3125 35.3438C25.3125 28.3651 19.6349 22.6875 12.6562 22.6875ZM18.2443 33.8068L11.6818 40.3693C11.4073 40.6439 11.0474 40.7812 10.6875 40.7812C10.3276 40.7812 9.96769 40.6439 9.69319 40.3693L6.88069 37.5568C6.3315 37.0077 6.3315 36.1173 6.88069 35.5681C7.42978 35.019 8.32022 35.019 8.86941 35.5681L10.6875 37.3863L16.2557 31.8181C16.8048 31.269 17.6952 31.269 18.2444 31.8181C18.7935 32.3673 18.7935 33.2577 18.2443 33.8068Z" fill="#FCA31E"/>
            <path d="M37.0312 12.1875C36.2546 12.1875 35.625 11.5579 35.625 10.7812V0H15.4688C13.1425 0 11.25 1.89253 11.25 4.21875V19.9396C11.7133 19.8976 12.1822 19.875 12.6562 19.875C17.4495 19.875 21.7403 22.0665 24.5799 25.5H39.8438C40.6204 25.5 41.25 26.1296 41.25 26.9062C41.25 27.6829 40.6204 28.3125 39.8438 28.3125H26.4326C27.3116 30.0278 27.8784 31.928 28.0604 33.9375H39.8438C40.6204 33.9375 41.25 34.5671 41.25 35.3438C41.25 36.1204 40.6204 36.75 39.8438 36.75H28.0604C27.6398 41.3943 25.1585 45.4524 21.5398 48H43.5938C45.92 48 47.8125 46.1075 47.8125 43.7812V12.1875H37.0312ZM39.8438 19.875H19.2188C18.4421 19.875 17.8125 19.2454 17.8125 18.4688C17.8125 17.6921 18.4421 17.0625 19.2188 17.0625H39.8438C40.6204 17.0625 41.25 17.6921 41.25 18.4688C41.25 19.2454 40.6204 19.875 39.8438 19.875Z" fill="#FCA31E"/>
            <path d="M38.4375 0.823395V9.37499H46.9885L38.4375 0.823395Z" fill="#FCA31E"/>
          </svg>

          <h1>KYC PROMPT</h1>

          <p>
            You have been prompted for KYC. This means your withdrawal will be on hold until
            you to provide us with KYC documentation which is required for the withdrawal to be
            processed. We do this due to regulatory demands. Click “understood” to open up live support.
          </p>

          <button className='understood bevel-gold' onClick={async () => {
            openSupport()
            props?.close()
          }}>
            UNDERSTOOD
          </button>
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

          display: flex;
          align-items: center;
          justify-content: center;

          z-index: 1000;
        }

        .close {
          width: 30px;
          height: 30px;
          
          right: 16px;
          top: 16px;

          background: #4E4A8D;
          box-shadow: 0px -1px 0px #5F5AA7, 0px 1px 0px #272548;
          border-radius: 3px;

          display: flex;
          align-items: center;
          justify-content: center;

          font-weight: 700;
          color: #ADA3EF;
          cursor: pointer;
          
          position: absolute;
        }

        .container {
          max-width: 500px;
          width: 100%;
          padding: 24px 16px;

          background: #2C2952;
          box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
          border-radius: 15px;

          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          color: #9489DB;
          text-align: center;
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 14px;
          font-weight: 500;

          transition: max-height .3s;
          position: relative;

          overflow: hidden;
        }

        .understood {
          width: 160px;
          height: 40px;
          
          margin-top: 16px;
        }
        
        h1 {
          margin: unset;
          color: var(--gold);
          font-family: Geogrotesque Wide, sans-serif;
          font-size: 22px;
          font-weight: 700;
        }
      `}</style>
    </>
  )
}

export default KYCModal