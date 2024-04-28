function Captcha(props) {
    return (
        <>
            {props?.active && (
                <div class='modal' onClick={() => props?.close()}>
                    <div class='captcha-container' onClick={(e) => e.stopPropagation()}>
                        <p>Solve the Captcha</p>
                        <div id='captcha-div'/>
                    </div>
                </div>
            )}

            <style jsx>{`
                .modal {
                  position: fixed;
                  top: 0;
                  left: 0;
                  
                  width: 100vw;
                  height: 100vh;

                  background: rgba(24, 23, 47, 0.55);
                  cubic-bezier(0,1,0,1);
                  
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  
                  z-index: 1000;
                }

                .captcha-container {
                  max-width: 350px;
                  color: white;

                  width: 100%;

                  background: #2C2952;
                  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
                  border-radius: 15px;

                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  font-weight: 700;
                  padding: 25px 0;
                  gap: 25px;
                  
                  transition: max-height .3s;
                  position: relative;

                  overflow: hidden;
                }
                
                .close {
                  position: absolute;
                  top: 15px;
                  left: 15px;

                  width: 26px;
                  height: 26px;
                  
                  background: #4E4A8D;
                  box-shadow: 0px -1px 0px #5F5AA7, 0px 1px 0px #272548;
                  border-radius: 3px;
                  
                  display: flex;
                  align-items: center;
                  justify-content: center;

                  font-weight: 700;
                  color: #ADA3EF;
                  cursor: pointer;
                }
            `}</style>
        </>
    )
}

export default Captcha