function GameInfo(props) {
    return (
        <>
            <div class='info-container' style={{ margin: props?.margin || '0 0 0 auto'}}>
                <svg width="7" height="9" viewBox="0 0 7 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.92754 6.14348V5.4C1.92754 5.2 1.9529 5.03043 2.00362 4.8913C2.05435 4.74348 2.14734 4.61304 2.28261 4.5C2.42633 4.38696 2.53623 4.3087 2.61232 4.26522C2.69686 4.21304 2.85326 4.13043 3.08152 4.01739L4.26087 3.43043C4.38768 3.36957 4.47645 3.32174 4.52717 3.28696C4.58635 3.24348 4.6413 3.17826 4.69203 3.0913C4.75121 3.00435 4.7808 2.89565 4.7808 2.76522V2.59565C4.7808 2.07391 4.34541 1.81304 3.47464 1.81304C2.62077 1.81304 2.19384 2.1 2.19384 2.67391V3.06522C2.19384 3.32609 2.07126 3.45652 1.82609 3.45652H0.355072C0.118358 3.45652 0 3.32609 0 3.06522V2.33478C0 1.66522 0.278986 1.1087 0.836957 0.665217C1.39493 0.221739 2.27415 0 3.47464 0C4.70048 0 5.59239 0.217391 6.15036 0.652174C6.71679 1.07826 7 1.62174 7 2.28261V2.71304C7 3.33913 6.86051 3.81739 6.58152 4.14783C6.31099 4.47826 5.93478 4.74348 5.4529 4.94348L4.76812 5.23043C4.52295 5.33478 4.36232 5.42609 4.28623 5.50435C4.21014 5.58261 4.1721 5.7087 4.1721 5.88261V6.14348C4.1721 6.28261 4.14674 6.38261 4.09601 6.44348C4.04529 6.49565 3.9523 6.52174 3.81703 6.52174H2.29529C2.16002 6.52174 2.0628 6.49565 2.00362 6.44348C1.9529 6.38261 1.92754 6.28261 1.92754 6.14348ZM4.1721 7.48696V8.62174C4.1721 8.76087 4.14674 8.86087 4.09601 8.92174C4.04529 8.97391 3.9523 9 3.81703 9H2.29529C2.16002 9 2.0628 8.97391 2.00362 8.92174C1.9529 8.86087 1.92754 8.76087 1.92754 8.62174V7.48696C1.92754 7.22609 2.05012 7.09565 2.29529 7.09565H3.81703C4.05374 7.09565 4.1721 7.22609 4.1721 7.48696Z" fill="#423579"/>
                </svg>

                <div class='desc'>
                  {props?.type === 'RTP' ? (
                    <>
                      <p>RTP: <span className='white'>{props?.rtp}%</span></p>
                      <div className='decoration-arrow'/>
                    </>
                  ) : (
                    <>
                      <p>TYPE: <span className='white'>{props?.type}</span></p>
                      <div className='decoration-arrow'/>
                    </>
                  )}
                </div>
            </div>

            <style jsx>{`
                .info-container {
                  min-width: 17px;
                  min-height: 17px;
                  
                  display: flex;
                  align-items: center;
                  justify-content: center;

                  border-radius: 5px;
                  background: radial-gradient(60.00% 60.00% at 50.00% 50.00%, #937EEC 0%, #6653B8 100%);
                  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.10), 0px 0.5px 0px 0px #6B59BA, 0px -0.5px 0px 0px #A08AFF;
                  
                  position: relative;
                  z-index: 2;
                  cursor: pointer;
                }
                
                .desc {
                  background: #554597;
                  border: 1px solid #6F5CC2;
                  border-radius: 2px;
                  
                  display: none;
                  align-items: center;
                  justify-content: center;
                  position: absolute;
                  padding: 0 10px;
                  height: 25px;
                  right: 27px;

                  color: #ADA3EF;
                  font-size: 12px;
                  font-weight: 700;
                  white-space: nowrap;
                }

                .decoration-arrow {
                  width: 13px;
                  height: 7px;

                  background: #554597;
                  position: absolute;
                  right: -9px;
                  rotate: 90deg;

                  clip-path: polygon(50% 0, 100% 100%, 0 100%);
                }
                
                .info-container:hover .desc {
                  display: flex;
                }
                
                p { 
                  margin-top: -2px;
                }
            `}</style>
        </>
    );
}

export default GameInfo;
