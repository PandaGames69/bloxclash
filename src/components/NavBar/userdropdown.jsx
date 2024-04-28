import {A, useSearchParams} from "@solidjs/router";
import {ADMIN_ROLES} from "../../resources/users";
import {createNotification, logout} from "../../util/api";

function UserDropdown(props) {

    const [searchParams, setSearchParams] = useSearchParams()

    return (
        <>
            <div class={'dropdown' + (props?.mobile ? ' mobile ' : ' ') + (props.active ? 'active' : '')} onClick={(e) => e.stopPropagation()}>
                <div class='decoration-arrow'/>
                <div class='links'>
                    {props?.mobile && (
                        <A href='/withdraw' class='user-dropdown-link' onClick={() => props.setActive(false)}>
                            <img src='/assets/icons/cart.svg' height='12' alt=''/>
                            Withdraw
                        </A>
                    )}

                    <A href='/profile/transactions' class='user-dropdown-link' onClick={() => props.setActive(false)}>
                        <img src='/assets/icons/user.svg' height='12' alt=''/>
                        Profile
                    </A>

                    <A href='/profile/transactions' class='user-dropdown-link' onClick={() => props.setActive(false)}>
                        <img src='/assets/icons/transactions.svg' height='12' alt=''/>
                        Transactions
                    </A>

                    <A href='/profile/settings' class='user-dropdown-link' onClick={() => props.setActive(false)}>
                        <img src='/assets/icons/settings.svg' height='12' alt=''/>
                        Settings
                    </A>

                    <A href='/profile/history' class='user-dropdown-link' onClick={() => props.setActive(false)}>
                        <img src='/assets/icons/history.svg' height='12'alt=''/>
                        History
                    </A>

                    <div class='user-dropdown-link gold' onClick={() => {
                        setSearchParams({ modal: 'freecoins' })
                        props.setActive(false)
                    }}>
                        <img src='/assets/icons/coin.svg' height='12' alt=''/>
                        Free Coins
                    </div>

                    <div class='user-dropdown-link' onClick={() => logout()}>
                        <img src='/assets/icons/signout.svg' height='12' alt=''/>
                        Sign out
                    </div>

                    {ADMIN_ROLES?.includes(props?.user?.role) && (
                        <A href='/admin' className='user-dropdown-link' onClick={() => props?.setActive(false)}>
                            <img src='/assets/icons/user.svg' height='12' alt=''/>
                            Admin
                        </A>
                    )}
                </div>
            </div>

            <style jsx>{`
              .dropdown {
                position: absolute;
                min-width: 180px;
                max-height: 0;

                top: 68px;
                right: 0;
                z-index: 1;

                border-radius: 3px 0 3px 3px;
                transition: max-height .3s;
                overflow: hidden;

                cursor: default;
              }

              .mobile {
                top: unset;
                bottom: 70px;
                min-width: 200px;
                right: unset;
                left: 0;
              }

              .dropdown.active {
                max-height: 240px;
              }

              svg.active {
                transform: rotate(180deg);
              }

              .decoration-arrow {
                width: 13px;
                height: 9px;

                top: 1px;
                background: #26214A;
                position: absolute;
                right: 0;

                border-left: 1px solid #3A336D;
                border-right: 1px solid #3A336D;
                border-top: 1px solid #3A336D;

                clip-path: polygon(0% 100%, 100% 0%, 100% 100%);
              }

              .mobile .decoration-arrow {
                display: none;
              }

              .links {
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding: 10px;

                border: 1px solid #3A336D;
                background: #26214A;

                margin-top: 9px;
              }
            `}</style>
        </>
    );
}

export default UserDropdown;
