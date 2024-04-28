function FAQ(props) {

    function toggleDropdown(e) {
        e.target.parentElement.classList.toggle('active')
    }

    return (
        <>
            <div class='tos-container'>
                <div class='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        Is there a reason why you need my Roblox credentials / Roblosecurity?

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div class='dropdown'>
                        <p>
                            We use your roblox authentication in order to automate our Peer-to-Peer (P2P) system for
                            Roblox deposits & withdraws. We never hold your Robux when you initate a deposit listing,
                            instead we store it in our queue system until a withdrawer initates the process. Automating
                            the P2P process makes it safer for both users and a more convenient experience. As a
                            reminder, we do not have access to your credentials.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        How do I deposit my Robux to play on the site?

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            You can create a Robux or Limited item deposit listing by clicking the Deposit tab, at the
                            top of the screen. Select the deposit method you'd like to use and then enter in the
                            required information into the boxes shown.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        Why have I been restricted from tipping users and raining Robux?

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            BloxClash uses a system to ensure users are not exploiting the site's balance system in any
                            way.This could be by mass- joining the site rains that we provide on multiple accounts, or
                            stealing user's accounts to tip the balance to your own. Ultimately, we have the final
                            decision when it comes to restricting you from creating & joining rains as well as receiving
                            & sending tips.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        Do I make any money when my affiliate wagers?

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            BloxClash offers a 0.5% incentive to affiliate code holders. You may also receive additional
                            perks & incentives if you have a large number of users under your affiliate code.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        How do you become a partnered creator?

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            We have a partnership channel in our discord that explains how to become partnered and what
                            we look for in creators. You may also email marketing@bloxclash.com with your channel link &
                            information and we will review your request.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        How can I tip users on the site?

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            You can click a user's profile in the chat by pressing on their profile image and then
                            clicking the Tip button. This will bring up a pop-up that will allow you to enter in your
                            desired tip amount. Otherwise, you can tip users by typing in the chat.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        How do I start a rain on the site?

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            You can create a rain for other site users to join by using the command "/rain (amount)",
                            without the quotations. This will deduct from your balance so make sure to not input the
                            incorrect amount!
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        I have an issue with the site and I cannot find where to contact support at.

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            You can email us directly at support@bloxclash.com or you can alternatively join our discord
                            server with the vanity URL being discord.gg/bloxclash.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        Do you rig the games provided on the site?

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            BloxClash has a state-of-the-art provably fair system to ensure all wagers that any users
                            place are fair and free from third-party manipulation. You can verify this by clicking the
                            Provably fair button at the top right of the site, or at the bottom of the site.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        I've opened a case and I did not receive the limited.

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            BloxClash.com uses a balance system to facilitate users withdrawals & deposits instead of an
                            on-site inventory. This is used to mitigate Roblox terminations which allows us to reward
                            our players with more incentives.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        I deposited and I still haven't recieved my balance.

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            Our Robux & Limited deposit system is Peer-to-Peer (P2P), which means a user must withdraw
                            in order to facilitate your deposit. In this instance, you must be patient. In the
                            circumstance where you haven't received your deposit but your Robux was taken from your
                            account, please contact support.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        I deposited via cryptocurrency and I haven't received my balance.

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            We use CoinPayments to process our cryptocurrency deposits which requires multiple
                            blockchain confirmations before we're able to credit your balance. You can check your
                            transaction ID provided by the exchange platform you used to view the amount of
                            confirmations.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        I disconnected mid-round while playing.

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            For specific games, latency is not a factor of the outcome of the game. We highly suggest
                            you do not play the Crash game mode if you experience a laggy internet connection. On any
                            other game mode, our provably fair system determines the outcome as soon as you place the
                            wager. Therefore, you can check your History tab in the Profile section to see the result.
                        </p>
                    </div>
                </div>

                <div className='dropdown-wrapper'>
                    <button onClick={toggleDropdown}>
                        I've found an on-site vulnerability.

                        <svg xmlns="http://www.w3.org/2000/svg" width="7" height="5" viewBox="0 0 7 5" fill="none">
                            <path
                                d="M3.50001 1.12732e-05C3.62547 1.12623e-05 3.7509 0.0480295 3.84655 0.143865L6.8564 3.16113C7.04787 3.35307 7.04787 3.66426 6.8564 3.85612C6.66501 4.04797 6.5 4.00001 6.16316 4.00001L3.50001 4.00001L1 4.00001C0.5 4.00001 0.335042 4.04788 0.14367 3.85602C-0.0478893 3.66417 -0.0478893 3.35298 0.14367 3.16104L3.15347 0.143772C3.24916 0.0479206 3.3746 1.12842e-05 3.50001 1.12732e-05Z"
                                fill="#9489DB"/>
                        </svg>
                    </button>

                    <div className='dropdown'>
                        <p>
                            Create a ticket within our discord or contact a member of our administration team
                            immediately. We will reward free on-site balance to those who report vulnerabilities.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .tos-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;

                color: #ADA3EF;
                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 13px;
                font-weight: 400;

                display: flex;
                flex-direction: column;
                gap: 15px;

              }

              button {
                width: 100%;
                max-width: 525px;
                height: 40px;

                border: unset;
                outline: unset;
                cursor: pointer;

                color: #ADA3EF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 12px;
                font-weight: 700;
                text-align: left;

                padding: 0 15px;

                border-radius: 2px;
                background: rgba(90, 84, 153, 0.35);

                display: flex;
                align-items: center;
                justify-content: space-between;
                
                border: 1px solid transparent;
                transition: all .3s;
              }
              
              .active button {
                border-radius: 2px;
                border: 1px solid #5A5499;
                background: rgba(90, 84, 153, 0.05);
              }
              
              .active button svg {
                rotate: 180deg;
              }

              .dropdown {
                display: flex;
                flex-direction: column;

                max-height: 0;
                overflow: hidden;

                transition: max-height .3s;
              }

              .code {
                width: 100%;
                height: auto;

                background: #272549;
                color: #47C754;

                padding: 15px;
              }

              pre {
                margin: unset;
              }

              p {
                margin: revert;
              }

              .active .dropdown {
                max-height: 500px;
              }
            `}</style>
        </>
    );
}

export default FAQ;
