import {A, Outlet, useLocation} from "@solidjs/router";

function Docs(props) {

    const location = useLocation()

    function isActive(page) {
        return location?.pathname?.includes(page)
    }

    return (
        <>
            <div class='docs-container'>
                <div class='info-container'>
                    <div class='pages'>
                        <div class='bar'/>

                        <button class={'page bevel ' + (isActive('faq') ? 'active' : '')}>
                            <A href='/docs/faq' class='gamemode-link'></A>
                            FAQ
                        </button>

                        <button class={'page bevel ' + (isActive('provably') ? 'active' : '')}>
                            <A href='/docs/provably' class='gamemode-link'></A>
                            Provably Fair
                        </button>

                        <button class={'page bevel ' + (isActive('tos') ? 'active' : '')}>
                            <A href='/docs/tos' class='gamemode-link'></A>
                            Terms Of Service
                        </button>

                        <button className={'page bevel ' + (isActive('aml') ? 'active' : '')}>
                            <A href='/docs/aml' class='gamemode-link'></A>
                            AML
                        </button>

                        <button class={'page bevel ' + (isActive('privacy') ? 'active' : '')}>
                            <A href='/docs/privacy' class='gamemode-link'></A>
                            Privacy Policy
                        </button>
                    </div>

                    <Outlet/>
                </div>
            </div>

            <style jsx>{`
              .docs-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;
                
                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }
              
              .info-container {
                width: 100%;
                height: fit-content;

                border-radius: 15px;
                background: rgba(45, 42, 85, 0.51);
                backdrop-filter: blur(5px);
                
                display: flex;
                flex-direction: column;
                gap: 10px;
                
                box-sizing: border-box;
                padding: 25px;
              }
              
              .pages {
                width: 100%;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                gap: 8px;
              }
              
              .page {
                height: 30px;
                padding: 0 8px;
                font-weight: 700;
                cursor: pointer;
                position: relative;
                border: 1px solid transparent;
                
                transition: color .3s;
              }
              
              .bar {
                border-radius: 555px;
                background: linear-gradient(135deg, #5A5499 0%, rgba(90, 84, 153, 0.00) 100%);
                height: 1px;
                flex: 1;
              }
              
              .page.active {
                box-shadow: unset;
                
                border-radius: 3px;
                border: 1px solid #4A457D;
                background: #363262;
                
                color: white;
              }
              
              @media only screen and (max-width: 1000px) {
                .docs-container {
                  padding-bottom: 90px;
                }
              }
            `}</style>
        </>
    );
}

export default Docs;
