function SurveyIssues(props) {
  return (
    <>
      <div className='modal' onClick={() => props?.close()}>
        <div className='container' onClick={(e) => e.stopPropagation()}>
          <p className='close bevel-light' onClick={() => props?.close()}>X</p>

          <svg xmlns="http://www.w3.org/2000/svg" width="59" height="59" viewBox="0 0 59 59" fill="none">
            <mask id="mask0_5805_206734" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="59" height="59">
              <path d="M0 0H59V59H0V0Z" fill="white"/>
            </mask>
            <g mask="url(#mask0_5805_206734)">
              <path d="M57.2715 36.4135C57.2715 36.4135 44.7742 53.6986 29.5 53.6986C14.2259 53.6986 1.72852 36.4135 1.72852 36.4135C1.72852 36.4135 14.2259 19.1283 29.5 19.1283C44.7742 19.1283 57.2715 36.4135 57.2715 36.4135Z" stroke="#FCA31E" stroke-width="3" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M29.5 5.30066V12.2147" stroke="#FCA31E" stroke-width="3" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M15.6719 8.75743L18.4971 14.4078" stroke="#FCA31E" stroke-width="3" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M43.3281 8.75743L40.5029 14.4078" stroke="#FCA31E" stroke-width="3" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5.30078 15.6714L9.20815 19.5787" stroke="#FCA31E" stroke-width="3" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M53.6994 15.6714L49.792 19.5787" stroke="#FCA31E" stroke-width="3" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M39.8711 36.4133C39.8711 42.1412 35.2278 46.7844 29.5 46.7844C23.7722 46.7844 19.1289 42.1412 19.1289 36.4133C19.1289 30.6855 23.7722 26.0422 29.5 26.0422C35.2278 26.0422 39.8711 30.6855 39.8711 36.4133Z" stroke="#FCA31E" stroke-width="3" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M29.5 39.8704C27.5938 39.8704 26.043 38.3195 26.043 36.4133C26.043 34.5071 27.5938 32.9563 29.5 32.9563C31.4062 32.9563 32.957 34.5071 32.957 36.4133C32.957 38.3195 31.4062 39.8704 29.5 39.8704Z" stroke="#FCA31E" stroke-width="3" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
          </svg>

          <h1>HAVING ISSUES?</h1>

          <p>
            Did you not receive your reward? We didn’t either! BloxClash is not
            paid until you receive your reward. This is why we CANNOT help
            you with offers. Contact the provider you did the offer on.
          </p>

          <button className='understood bevel-gold' onClick={async () => {
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

export default SurveyIssues