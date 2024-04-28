import {A, Outlet, useLocation, useSearchParams} from "@solidjs/router";
import {useUser} from "../contexts/usercontextprovider";

const URL_TO_PAGE = {
    '/admin': 'DASHBOARD',
    '/admin/users': 'USERS',
    '/admin/user': 'USERS',
    '/admin/statistics': 'STATISTICS',
    '/admin/filter': 'FILTER',
    '/admin/cashier': 'CASHIER',
    '/admin/rain': 'RAIN',
    '/admin/statsbook': 'STATSBOOK',
    '/admin/settings': 'SETTINGS'
}

function Admin(props) {

    const location = useLocation()
    const [user] = useUser()
    const [params, setParams] = useSearchParams()

    return (
        <>
            <div class='admin-container fadein'>

                <div class='banner'>
                    <img src='/assets/icons/logoswords.png' width='25' height='19' alt=''/>
                    <p>ADMIN PANEL</p>
                    <div className='line'/>
                </div>

                <div class='user-info'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="19" viewBox="0 0 16 19" fill="none">
                        <path d="M7.99971 0.104492C5.35299 0.104492 3.19971 2.25777 3.19971 4.90449C3.19971 7.55121 5.35299 9.70449 7.99971 9.70449C10.6464 9.70449 12.7997 7.55121 12.7997 4.90449C12.7997 2.25777 10.6464 0.104492 7.99971 0.104492Z" fill="#ADA3EF"/>
                        <path d="M13.9721 12.8403C12.658 11.506 10.9159 10.7712 9.06667 10.7712H6.93333C5.08416 10.7712 3.34201 11.506 2.02788 12.8403C0.720178 14.1681 0 15.9208 0 17.7756C0 18.0702 0.238791 18.309 0.533333 18.309H15.4667C15.7612 18.309 16 18.0702 16 17.7756C16 15.9208 15.2798 14.1681 13.9721 12.8403Z" fill="#ADA3EF"/>
                    </svg>

                    <p>
                        ADMIN USER -
                        &nbsp;<span class='gold id'>ACCOUNT ID</span>
                        &nbsp;<span class='id gray'>{user()?.id}</span>
                    </p>

                    <div class='pages-container'>
                        {URL_TO_PAGE[location?.pathname] === 'CASHIER' && (
                            <div className='pages bevel-light' onClick={(e) => e.currentTarget.classList.toggle('active')}>
                                <p>{params?.type || 'ROBUX'}</p>

                                <div className='pages-dropdown' onClick={(e) => e.stopPropagation()}>
                                    <p onClick={() => setParams({ type: null })}>ROBUX</p>
                                    <p onClick={() => setParams({ type: 'crypto' })}>CRYPTO</p>
                                </div>
                            </div>
                        )}

                        <div class='pages bevel-light' onClick={(e) => e.currentTarget.classList.toggle('active')}>
                            <p>{URL_TO_PAGE[location?.pathname]}</p>

                            <div class='pages-dropdown' onClick={(e) => e.stopPropagation()}>
                                <A href='/admin' class='admin-link'>DASHBOARD</A>
                                <A href='/admin/users' class='admin-link'>USERS</A>
                                <A href='/admin/statistics' class='admin-link'>STATISTICS</A>
                                <A href='/admin/filter' class='admin-link'>FILTER</A>
                                <A href='/admin/cashier' class='admin-link'>CASHIER</A>
                                <A href='/admin/rain' class='admin-link'>RAIN</A>
                                <A href='/admin/statsbook' class='admin-link'>STATSBOOK</A>
                                <A href='/admin/settings' class='admin-link'>SETTINGS</A>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='bar' style={{margin: '25px 0 30px 0'}}/>

                <Outlet/>
            </div>

            <style jsx>{`
              .admin-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }

              .bar {
                width: 100%;
                height: 1px;
                min-height: 1px;
                background: #5A5499;
              }
              
              .user-info {
                display: flex;
                gap: 10px;
                align-items: center;

                color: #FFF;
                font-size: 18px;
                font-weight: 700;
              }
              
              .pages-container {
                margin-left: auto;
                display: flex;
                gap: 10px;
              }
              
              .pages {
                display: flex;
                gap: 10px;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                position: relative;
                
                user-select: none;

                width: 130px;
                height: 40px;
              }
              
              .pages-dropdown {
                display: none;
                position: absolute;
                z-index: 1;

                border-radius: 3px;
                background: #4A4581;
                
                flex-direction: column;
                
                width: 100%;
                top: 50px;
                
                padding: 10px 15px;
              }
              
              .pages {
                text-transform: uppercase;
              }
              
              .pages-dropdown a {
                opacity: 0.5;
                transition: opacity .3s;
              }
              
              .pages-dropdown a:hover {
                opacity: 1;
              }
              
              .active .pages-dropdown {
                display: flex;
              }
              
              .id {
                font-size: 14px;
              }
              
              .id.gray {
                color: #9F9AC8;
                font-weight: 500;
              }
              
              .banner {
                outline: unset;
                border: unset;

                width: 100%;
                height: 45px;

                border-radius: 5px;
                background: linear-gradient(90deg, rgb(104, 100, 164) -49.01%, rgba(90, 84, 149, 0.655) -5.08%, rgba(66, 53, 121, 0) 98.28%);

                padding: 0 15px;
                display: flex;
                align-items: center;
                gap: 12px;

                color: white;
                font-size: 22px;
                font-weight: 600;
                
                margin-bottom: 30px;
              }

              .line {
                flex: 1;
                height: 1px;

                border-radius: 2525px;
                background: linear-gradient(90deg, #5A5499 0%, rgba(90, 84, 153, 0.00) 100%);
              }

              @media only screen and (max-width: 1000px) {
                .admin-container {
                  padding-bottom: 90px;
                }
              }
            `}</style>
        </>
    );
}

export default Admin
