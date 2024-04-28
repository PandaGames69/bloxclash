function Privacy(props) {
    return (
        <>
            <div class='privacy-container'>

                <div class='sections'>
                    <p>
                        At BloxClash.com, we take the privacy of our users seriously. Our Privacy Policy explains how
                        we collect, use, and protect your personal information when you use our website. By using
                        BloxClash.com, you agree to the terms of this Privacy Policy.
                    </p>

                    <div class='section'>
                        <h2 class='point'>Information We Collect</h2>
                        <p>When you use our website, we may collect the following information:</p>

                        <ul>
                            <li>Your name and username</li>
                            <li>Your email address</li>
                            <li>Your IP address</li>
                            <li>Your location data (if you allow us to access it)</li>
                            <li>Your device information (such as your device type, browser type, and operating system)</li>
                            <li>Your gameplay data (such as your game progress, achievements, and stats)</li>
                            <li>Your chat messages and other communications with other users on our website</li>
                        </ul>
                    </div>

                    <div class='section'>
                        <h2 class='point'>How We Use Your Information</h2>
                        <p>We use your personal information for the following purposes:</p>

                        <ul>
                            <li>To provide you with access to our website and our games</li>
                            <li>To communicate with you about our website and our games</li>
                            <li>To personalize your user experience on our website</li>
                            <li>To monitor and analyze the usage of our website and our games</li>
                            <li>To comply with legal and regulatory requirements</li>
                        </ul>

                        <p>
                            We may also use your information for other purposes that are consistent with the above
                            purposes and are disclosed to you at the time we collect your information.
                        </p>
                    </div>

                    <div class='section'>
                        <h2 class='point'>How We Protect Your Information</h2>
                        <p>
                            We take reasonable measures to protect your personal information from unauthorized access,
                            use, or disclosure. We use a variety of security technologies and procedures to help protect
                            your personal information from unauthorized access, use, or disclosure.
                        </p>

                        <p>
                            However, no method of transmission over the Internet, or method of electronic storage,
                            is 100% secure. Therefore, we cannot guarantee the absolute security of your
                            personal information.
                        </p>
                    </div>

                    <div class='section'>
                        <h2 class='point'>Sharing Your Information</h2>
                        <p>
                            We may share your personal information with third-party service providers who perform
                            services on our behalf, such as hosting our website, providing customer support,
                            or processing payments.
                        </p>

                        <p>
                            We may also share your personal information if we believe that disclosure is necessary to
                            comply with a legal obligation, protect our rights or property, or prevent fraud or
                            other illegal activity.
                        </p>
                    </div>

                    <div class='section'>
                        <h2 class='point'>Your Choices</h2>
                        <p>
                            You can choose not to provide us with certain information, but that may limit your ability
                            to use certain features of our website and our games.
                        </p>

                        <p>
                            You can also opt-out of receiving promotional emails from us by following the
                            instructions in those emails.
                        </p>
                    </div>

                    <div class='section'>
                        <h2 class='point'>Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time by posting a new version on our website.
                            You should check this page periodically to review any changes.
                        </p>
                    </div>

                    <div class='section'>
                        <h2 class='point'>Contact Us</h2>
                        <p>
                            If you have any questions or concerns about this Privacy Policy,
                            please contact us at support@bloxclash.com
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
              .privacy-container {
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
              }
              
              .point {
                color: #FFF;
                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 18px;
                font-weight: 700;
                margin: 0 0 10px 0;
              }
              
              .sections {
                display: flex;
                flex-direction: column;
                gap: 25px;
              }
              
              .section {
                display: flex;
                flex-direction: column;
                gap: 10px;
              }
              
              ul {
                padding: unset;
                margin-left: 20px;
              }
            `}</style>
        </>
    );
}

export default Privacy;
