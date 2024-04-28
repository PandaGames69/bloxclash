function GreenCount(props) {
    return (
        <>
            <div class={'count ' + (props.active ? 'active' : '')} style={props.css}>
                <div class='dot'/>
                {props?.max ? (
                    <p>{props.number} / {props?.max}</p>
                ) : (
                    <p>{props?.number}</p>
                )}
            </div>

            <style jsx>{`
              .count {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;

                border-radius: 3px;
                height: 35px;

                font-weight: 700;
                font-size: 14px;
                color: #9296D6;
                
                position: relative;
                z-index: 0;

                border: 1px dashed #9296D6;
                background: linear-gradient(0deg, rgba(146, 150, 214, 0.25) 0%, rgba(146, 150, 214, 0.25) 100%), linear-gradient(230deg, #1A0E33 0%, #423C7A 100%);
                
                overflow: hidden;
              }
              
              .count.active {
                color: #59E878;
                border: unset;
                background: unset;
              }
              
              .count.active::before {
                width: calc(100% - 2px);
                height: calc(100% - 2px);
                border-radius: 3px;
                
                top: 1px;
                left: 1px;
                
                content: '';
                position: absolute;

                background: linear-gradient(0deg, rgba(89, 232, 120, 0.25), rgba(89, 232, 120, 0.25)), linear-gradient(252.77deg, #1A0E33 -27.53%, #423C7A 175.86%);
                z-index: -1;
              }

              .count.active::after {
                width: calc(100% + 5px);
                aspect-ratio: 1;
                border-radius: 3px;
                

                content: '';
                position: absolute;

                background: conic-gradient(from 180deg at 50% 50%, #59E878 -0.3deg, #459D7B 72.1deg, #407B64 139.9deg, #407C64 180.52deg, #37545C 215.31deg, #3B5964 288.37deg, #59E878 359.62deg, #59E878 359.7deg, #459D7B 432.1deg);
                z-index: -2;

                animation: rotate linear 3s infinite;
              }
              
              @keyframes rotate {
                from {
                  transform: rotate(0deg);
                }
                to {
                  transform: rotate(360deg);
                }
              }
              
              .dot {
                height: 15px;
                width: 15px;

                background: #5E5898;
                border-radius: 3px;
                
                display: flex;
                align-items: center;
                justify-content: center;
                
                position: relative;
              }
              
              .dot:before {
                height: 7px;
                width: 7px;
                
                content: '';
                position: absolute;
                
                background: #9296D6;
                border-radius: 3px;
              }
              
              .active .dot {
                background: rgba(89, 232, 120, 0.25);
              }
              
              .active .dot:before {
                background: #59E878;
                box-shadow: 0px 0px 4px #59E878;
              }
            `}</style>
        </>
    );
}

export default GreenCount;
