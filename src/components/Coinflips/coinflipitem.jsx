function CoinflipItem(props) {

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

    function getImage() {
        if (props?.img) return `${import.meta.env.VITE_SERVER_URL}${props.img}`
        return '/assets/icons/coin.svg'
    }

    return (
        <>
            <div class={'cf-item ' + (getRarity(props?.price || 0))}>
                <img class='item-image' src={getImage()} height='35' width='35' alt=''
                     draggable={false}/>
            </div>

            <style jsx>{`
              .cf-item {
                height: 55px;
                
                min-width: 65px;
                width: 65px;
                
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                
                border-radius: 10px;
                z-index: 0;
                padding: 1px;
              }
              
              .gray {
                background: linear-gradient(45deg, rgba(169, 181, 210, 0.5), rgba(169, 181, 210, 0) 70%);
              }

              .blue {
                background: linear-gradient(45deg, rgba(65, 118, 255, 0.5), rgba(65, 118, 255, 0) 70%);
              }

              .pink {
                background: linear-gradient(45deg, rgba(220, 95, 222, 0.5), rgba(220, 95, 222, 0) 70%);
              }

              .red {
                background: linear-gradient(45deg, rgba(255, 81, 65, 0.5), rgba(255, 81, 65, 0) 70%);
              }

              .gold {
                background: linear-gradient(45deg, rgba(255, 153, 1, 0.5), rgba(255, 153, 1, 0) 70%);
              }

              .cf-item:before {
                position: absolute;
                content: '';
                border-radius: 10px;
                z-index: -1;
                background: radial-gradient(104.74% 70.25% at 50.00% 76.90%, rgba(169, 181, 210, 0.14) 0%, rgba(169, 181, 210, 0.00) 100%), rgba(0, 0, 0, 0.3);
                top: 1px;
                left: 1px;
                width: calc(100% - 2px);
                height: calc(100% - 2px);
              }
              
              .blue:before {
                background: radial-gradient(104.74% 70.25% at 50.00% 76.90%, rgba(65, 118, 255, 0.14) 0%, rgba(65, 118, 255, 0.00) 100%), rgba(0, 0, 0, 0.3);
              }
              
              .pink:before {
                background: radial-gradient(104.74% 70.25% at 50.00% 76.90%, rgba(220, 95, 222, 0.14) 0%, rgba(220, 95, 222, 0.00) 100%), rgba(0, 0, 0, 0.3);
              }
              
              .red:before {
                background: radial-gradient(104.74% 70.25% at 50.00% 76.90%, rgba(255, 81, 65, 0.14) 0%, rgba(255, 81, 65, 0.00) 100%), rgba(0, 0, 0, 0.3);
              }

              .gold:before {
                background: radial-gradient(104.74% 70.25% at 50.00% 76.90%, rgba(252, 163, 30, 0.14) 0%, rgba(0, 0, 0, 0.00) 100%), rgba(0, 0, 0, 0.21);
              }
              
              .item-image {
                margin: auto 0;
              }
            `}</style>
        </>
    );
}

export default CoinflipItem;
