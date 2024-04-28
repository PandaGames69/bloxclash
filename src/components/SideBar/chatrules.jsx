import {createSignal, For} from "solid-js";
import {addDropdown} from "../../util/api";

const rules = [
    'No racism or harassment of any kind is allowed',
    'Begging of items or balance in any chat other than the begging channel is prohibited.',
    'Spamming is not allowed and will result in a mute.',
    'Open a ticket if you experience any technical issues',
    'Do not promote your affiliate codes or any site in chat.',
]

function ChatRules() {

    const [active, setActive] = createSignal(false)
    addDropdown(setActive)

    return (
        <>
            <div class='rules-container' onClick={(e) => e.stopPropagation()}>
                <div class='bevel rules' onClick={() => setActive(!active())}>
                    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12.1254 8.40318H11.2552V1.78249C11.2552 0.795756 10.4184 0 9.38085 0H1.78308C1.74961 0 1.71614 3.1497e-08 1.68267 0.0159152C0.645093 0.127321 -0.0912549 1.00265 0.00915613 1.98939C0.109567 2.81698 0.795709 3.48541 1.68267 3.5809C1.71614 3.5809 1.74961 3.59682 1.78308 3.59682H1.8835V10.2175V10.2334C1.90023 11.2042 2.73699 12 3.75783 12H11.9915H12.0417H12.1254C13.163 12 13.9998 11.2042 13.9998 10.2175C14.0165 9.19894 13.163 8.40318 12.1254 8.40318ZM1.8835 2.62599V2.61008C1.39818 2.61008 1.01327 2.24403 1.01327 1.78249C1.01327 1.32095 1.39818 0.954907 1.8835 0.954907H7.72407C7.43957 1.48011 7.43957 2.1008 7.72407 2.62599H1.8835ZM9.91638 9.13528H3.05496V8.18037H9.91638V9.13528ZM9.91638 7.22546H3.05496V6.27056H9.91638V7.22546ZM9.91638 5.31565H3.05496V4.36074H9.91638V5.31565ZM12.1422 11.0133C11.6568 11.0133 11.2719 10.6472 11.2719 10.1857V9.35809H12.1422C12.6275 9.35809 13.0124 9.72414 13.0124 10.1857C13.0124 10.6472 12.6275 11.0133 12.1422 11.0133Z"
                            fill="#ADA3EF"/>
                    </svg>
                    RULES
                </div>

                <div class={'dropdown ' + (active() ? 'active' : '')}>
                    <div class='decoration-arrow'/>
                    <div class='dropdown-container'>
                        <For each={rules}>{(rule, index) =>
                            <div class='rule'>
                                <p class='number'>{index() + 1}</p>
                                <p>{rule}</p>
                            </div>
                        }</For>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .rules-container {
                position: relative;
                z-index: 2;
                flex: 1;
              }
              
              .rules {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;

                height: 35px;

                font-weight: 700;
                font-size: 14px;
                color: #ADA3EF;

                cursor: pointer;
                user-select: none;
              }

              .dropdown {
                position: absolute;
                width: 270px;

                border-radius: 3px 0px 3px 3px;

                top: 40px;
                left: 0;

                max-height: 0;
                z-index: 1;
                transition: max-height .3s;
                overflow: hidden;
              }

              .dropdown.active {
                max-height: 300px;
              }

              .decoration-arrow {
                width: 13px;
                height: 9px;

                top: 1px;
                background: #201B3D;
                position: absolute;
                left: 0;

                border-left: 1px solid #2D2654;
                border-right: 1px solid #2D2654;
                border-top: 1px solid #2D2654;

                clip-path: polygon(100% 100%, 0% 0%, 0% 100%);
              }

              .dropdown-container {
                padding: 15px 10px;
                border: 1px solid #2D2654;
                background: #201B3D;
                margin-top: 9px;

                font-family: 'Geogrotesque Wide';
                font-weight: 600;
                font-size: 13px;
                color: #ADA3EF;

                display: flex;
                flex-direction: column;
                gap: 10px;
              }
              
              .rule {
                display: flex;
                gap: 10px;
              }
              
              .number {
                background: rgba(90, 84, 153, 0.35);
                border-radius: 2px;
                
                height: 20px;
                width: 20px;
                min-height: 20px;
                min-width: 20px;
                
                display: flex;
                align-items: center;
                justify-content: center;

                font-size: 10px;
                margin-top: 4px;
              }
            `}</style>
        </>
    );
}

export default ChatRules;
