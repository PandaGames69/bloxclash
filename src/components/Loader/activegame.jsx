function ActiveGame(props) {
  return (
    <>
      <div className='loader-container'>
        <div className='loader'/>
      </div>

      <style jsx>{`
        .loader-container {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;

          width: 31px;
          height: 31px;
          flex-shrink: 0;

          border-radius: 3px;
          border: 1px dashed rgba(89, 232, 120, 0.25);
          background: linear-gradient(0deg, rgba(89, 232, 120, 0.25) 0%, rgba(89, 232, 120, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
        }

        .loader {
          height: 12px;
          width: 12px;
          border-top: 2px solid #59E878;
          border-left: 2px solid #59E878;
          border-right: 2px solid #59E878;
          border-radius: 50%;
          animation: infinite linear spin 1s;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

export default ActiveGame;
