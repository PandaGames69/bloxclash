import {authedAPI} from "../../util/api";
import {createSignal} from "solid-js";
import {useNavigate} from "@solidjs/router";

function AdminMFA(props) {

    const [token, setToken] = createSignal()
    const navigate = useNavigate()

    return (
        <>
            <div className='modal' onClick={() => navigate('/')}>
                <div className='mfa-container' onClick={(e) => e.stopPropagation()}>
                    <div class='mfa-header'>
                        <p className='close bevel-light' onClick={() => navigate('/')}>X</p>
                        <h1>2FA</h1>
                    </div>

                    <div class='mfa-content'>
                        <div class='code-container'>
                            <input type='number' placeholder='000000' value={token()} onInput={(e) => setToken(e.target.value)}/>
                            <p>ENTER YOUR 2FA CODE</p>
                        </div>

                        <div class='bar'/>

                        <button className='proceed bevel-gold' onClick={async () => {
                            let res = await authedAPI('/admin/2fa', 'POST', JSON.stringify({
                                token: token()
                            }), true)

                            if (res.success) {
                                props?.refetch()
                            }
                        }}>
                            PROCEED
                        </button>
                    </div>
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

                .mfa-container {
                  max-width: 880px;
                  color: white;

                  width: 100%;

                  background: #2C2952;
                  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
                  border-radius: 15px;

                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  font-weight: 700;
                  
                  transition: max-height .3s;
                  position: relative;

                  overflow: hidden;
                }
                
                .mfa-header {
                  width: 100%;
                  height: 60px;
                  background: #322F5F;
                  
                  display: flex;
                  align-items: center;
                  padding: 0 20px;
                  gap: 15px;
                }
                
                .bar {
                  width: 100%;
                  min-height: 1px;
                  height: 100%;
                  background: #373565;
                }
                
                .mfa-content {
                  width: 100%;
                  padding: 25px;
                  
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  
                  gap: 25px;
                }
                
                .code-container {
                  border-radius: 5px;
                  border: 1px dashed #544F94;
                  background: rgba(90, 84, 153, 0.27);
                  
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  
                  width: 100%;
                  height: 90px;

                  color: #ADA3EF;
                  font-family: Geogrotesque Wide, sans-serif;
                  font-size: 13px;
                  font-weight: 600;
                  
                  padding: 12px;
                  gap: 10px;
                }
                
                .code-container input {
                  height: 100%;
                  
                  background: unset;
                  border: unset;
                  outline: unset;

                  color: #FFF;
                  font-family: Geogrotesque Wide, sans-serif;
                  font-size: 20px;
                  font-weight: 700;
                  
                  text-align: center;
                }

                .code-container input::placeholder {
                  color: rgba(255,255,255,0.25);
                  font-family: Geogrotesque Wide, sans-serif;
                  font-size: 20px;
                  font-weight: 700;
                }
                
                h1 {
                  color: #FFF;
                  font-family: Geogrotesque Wide, sans-serif;
                  font-size: 16px;
                  font-weight: 700;
                }

                .close {
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
                
                .proceed {
                  width: 160px;
                  height: 40px;
                }
            `}</style>
        </>
    )
}

export default AdminMFA