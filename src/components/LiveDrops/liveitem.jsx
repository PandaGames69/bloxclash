function LiveItem(props) {

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

    return (
        <>
            <div class={'live-item-container ' + (getRarity(props.price))}>
                <img src={`${import.meta.env.VITE_SERVER_URL}${props.img}`} alt='' height='40'/>
            </div>

            <style jsx>{`
              .live-item-container {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 55px;
                
                position: relative;
                z-index: 0;

                border-radius: 10px;
              }

              .live-item-container:before {
                position: absolute;
                content: '';
                border-radius: 10px;
                z-index: -1;
                background: radial-gradient(104.74% 70.25% at 50.00% 76.90%, rgba(169, 181, 210, 0.14) 0%, rgba(169, 181, 210, 0.00) 100%), #18172b;
                top: 1px;
                left: 1px;
                width: calc(100% - 2px);
                height: calc(100% - 2px);
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

              .blue:before {
                background: radial-gradient(104.74% 70.25% at 50.00% 76.90%, rgba(65, 118, 255, 0.14) 0%, rgba(65, 118, 255, 0.00) 100%), #18172b;
              }

              .pink:before {
                background: radial-gradient(104.74% 70.25% at 50.00% 76.90%, rgba(220, 95, 222, 0.14) 0%, rgba(220, 95, 222, 0.00) 100%), #18172b;
              }

              .red:before {
                background: radial-gradient(104.74% 70.25% at 50.00% 76.90%, rgba(255, 81, 65, 0.14) 0%, rgba(255, 81, 65, 0.00) 100%), #18172b;
              }

              .gold:before {
                background: radial-gradient(104.74% 70.25% at 50.00% 76.90%, rgba(252, 163, 30, 0.14) 0%, rgba(0, 0, 0, 0.00) 100%), #18172b;
              }
            `}</style>
        </>
    );
}

export default LiveItem;
