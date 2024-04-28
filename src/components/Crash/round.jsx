function CrashRound(props) {

    function getColor() {
        if (props?.multi >= 10) return 'gold'
        if (props?.multi >= 2) return 'green'
        return 'silver'
    }

    return (
        <>
            <div class={'crash-round-container ' + (getColor())}>
                <p>x{props?.multi?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>

            <style jsx>{`
              .crash-round-container {
                width: 95px;
                min-width: 95px;
                height: 45px;
                
                position: relative;
                z-index: 0;
                
                background: url("/assets/icons/goldplate.png");
                background-size: cover;
                opacity: 0.5;
                
                display: flex;
                align-items: center;
                justify-content: center;

                font-family: Geogrotesque Wide, sans-serif;
                font-size: 14px;
                font-weight: 700;
              }
              
              .gold p {
                background: linear-gradient(180deg, #FCA31E 42.21%, #FDC470 57.73%, #FFD596 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              
              .crash-round-container:first-child {
                opacity: 1;
              }
              
              .green {
                background: url("/assets/icons/greenplate.png");
                background-size: cover;
              }
              
              .green p {
                background: linear-gradient(180deg, #6BC349 42.21%, #85DA65 57.73%, #ABFB8C 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              
              .silver {
                filter: grayscale(100%);
              }
              
              .silver p {
                color: #D6D1E5 !important;
              }
            `}</style>
        </>
    );
}

export default CrashRound
