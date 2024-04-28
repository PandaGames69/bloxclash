function CaseItem(props) {

    function backImage(price) {
        if (price >= 250000) {
            return '/assets/icons/fancygoldsword.png' // Gold
        } else if (price >= 50000) {
            return '/assets/icons/fancyredsword.png' // Red
        } else if (price >= 10000) {
            return '/assets/icons/fancypurplesword.png' // Pink
        } else if (price >= 1000) {
            return '/assets/icons/fancybluesword.png'
        }
        return '/assets/icons/fancygraysword.png' // Gray
    }

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
            <div class={'case-item-container ' + (props?.grid ? 'grid ' : '') + (getRarity(props?.price || 0))}>

                <div class='item-content'>
                    <p class='name'>{props?.name || 'Unknown Item'}</p>
                    <p class='percent'>{props?.probability || '0.000'}%</p>

                    <img class='item-image' src={`${import.meta.env.VITE_SERVER_URL}${props.img}`} height='60' alt='' draggable={false}/>
                </div>

                <div class='price'>
                    <img src='/assets/icons/coin.svg' height='12' alt=''/>
                    <p>{props?.price?.toLocaleString(undefined, { minimumFractionDigits: 0 }) || '0.00'}</p>
                </div>

                <img className='background-logo' src={backImage(props?.price)} height='70' alt=''/>
            </div>

            <style jsx>{`
              .case-item-container {
                max-height: 170px;
                height: 100%;
                
                min-width: 130px;
                width: 130px;
                
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                
                border-radius: 10px;
                z-index: 0;
              }
              
              .grid {
                width: unset;
                min-width: unset;
                min-height: 170px;
              }
              
              .gray {
                border-bottom: 1px solid #A9B5D2;
              }

              .blue {
                border-bottom: 1px solid #4176FF;
              }

              .pink {
                border-bottom: 1px solid #DC5FDE;
              }

              .red {
                border-bottom: 1px solid #FF5141;
              }

              .gold {
                border-bottom: 1px solid var(--gold);
              }

              .case-item-container:before {
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
              
              .item-content {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                align-items: center;
                justify-content: center;
                padding: 12px 12px 0 12px;
              }
              
              .name {
                color: #FFF;
                text-align: center;
                font-size: 11px;
                font-weight: 700;
              }
              
              .percent {
                color: #726B98;
                font-size: 12px;
                font-weight: 700;
              }
              
              .item-image {
                margin: auto 0;
              }
              
              .gold .price {
                background: unset !important;
              }
              
              .price {
                width: 100%;
                min-height: 20px;
                
                border-radius: 0px 0px 9px 9px;
                background: rgba(0, 0, 0, 0.23);
                
                display: flex;
                align-items: center;
                justify-content: center;

                color: #FFF;
                font-family: Geogrotesque Wide;
                font-size: 12px;
                font-weight: 700;
                gap: 5px;
                
                margin-top: auto;
              }
              
              .background-logo {
                position: absolute;
                bottom: 40px;
                opacity: 0.15;
              }
            `}</style>
        </>
    );
}

export default CaseItem;
