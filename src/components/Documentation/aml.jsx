function AML(props) {
    return (
        <>
            <div class='privacy-container'>

                <div class='sections'>
                    <p>
                        BloxClash is committed to maintaining the highest standards of integrity and compliance with all applicable laws and regulations.
                        We recognize the importance of preventing money laundering and the financing of terrorism activities on our platform.
                        This Anti-Money Laundering (AML) Policy outlines our commitment to detecting and preventing money laundering activities and serves as a framework
                        for our efforts to ensure compliance with AML laws and regulations.
                    </p>

                    <div class='section'>
                        <h2 class='point'>Purpose</h2>
                        <p>The purpose of this AML Policy is to establish clear guidelines and procedures to:</p>

                        <ol type='a'>
                            <li>Detect and prevent money laundering and terrorist financing activities on the BloxClash platform.</li>
                            <li>Identify and verify the identity of our users, ensuring they comply with applicable AML laws and regulations.</li>
                            <li>Report suspicious transactions and activities to relevant authorities.</li>
                            <li>Maintain a risk-based approach to AML, continuously assessing and mitigating risks associated with our business.</li>
                        </ol>
                    </div>

                    <div class='section'>
                        <h2 class='point'>Customer Due Diligence (CDD)</h2>

                        <p>3.1 User Identification</p>
                        <ul>
                            <li>BloxClash will perform adequate user identification procedures to verify the identity of its users. We will collect and maintain user information in accordance with applicable laws and regulations.</li>
                        </ul>

                        <p>3.2 Risk-Based Approach</p>
                        <ul>
                            <li>We will adopt a risk-based approach to assess the level of customer due diligence required for different types of users. Enhanced due diligence measures will be applied to users deemed to be of higher risk.</li>
                        </ul>

                        <p>3.3 Ongoing Monitoring</p>
                        <ul>
                            <li>We will conduct ongoing monitoring of user transactions and activities to detect and report suspicious activities promptly. This may include the use of transaction monitoring tools and systems.</li>
                        </ul>
                    </div>

                    <div class='section'>
                        <h2 class='point'>Reporting Suspicious Activities</h2>
                        <p>
                            BloxClash is committed to reporting suspicious transactions or activities to relevant authorities,
                            including but not limited to the Financial Intelligence Unit (FIU), as required by law.
                            We will maintain records of such reports as necessary.
                        </p>
                    </div>

                    <div class='section'>
                        <h2 class='point'>Training and Awareness</h2>
                        <p>
                            We will provide training to our employees to ensure they are aware of AML laws and regulations
                            and the procedures outlined in this policy. Regular training will be conducted to keep our
                            staff informed and up-to-date with the latest developments in AML.
                        </p>
                    </div>

                    <div class='section'>
                        <h2 class='point'>Record-Keeping</h2>
                        <p>
                            BloxClash will maintain records of user identification and transaction
                            information for the period required by applicable AML laws and regulations.
                        </p>
                    </div>

                    <div class='section'>
                        <h2 class='point'>Sanctions Screening</h2>
                        <p>
                            We will conduct sanctions screening to ensure that our users are not individuals or
                            entities subject to sanctions or restrictions imposed by relevant authorities.
                        </p>
                    </div>

                    <div class='section'>
                        <h2 class='point'>Compliance Officer</h2>
                        <p>
                            A designated compliance officer will oversee the implementation of this AML Policy,
                            monitor its effectiveness, and ensure that all employees and users comply with
                            AML requirements.
                        </p>
                    </div>

                    <div className='section'>
                        <h2 className='point'>Review and Update</h2>
                        <p>
                            This AML Policy will be reviewed periodically to ensure its effectiveness and compliance
                            with changing AML laws and regulations. Updates will be made as necessary.
                        </p>
                    </div>

                    <div className='section'>
                        <h2 className='point'>Conclusion</h2>
                        <p>
                            BloxClash is dedicated to maintaining a secure and compliant platform for its users.
                            This AML Policy is a cornerstone of our commitment to preventing money laundering and
                            terrorist financing activities while upholding the highest standards of integrity and compliance.
                        </p>

                        <p>
                            By using BloxClash, users agree to comply with this AML Policy and cooperate with our efforts
                            to prevent illicit activities on our platform. Failure to do so may result in account suspension or legal action,
                            as deemed appropriate.
                        </p>

                        <p>
                            For any AML-related inquiries or concerns, please contact our designated compliance officer at support@bloxclash.com.
                        </p>
                    </div>

                    <p>Last Updated: 10/10/2023</p>
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
              
              ul, ol {
                padding: unset;
                margin-left: 20px;
              }
            `}</style>
        </>
    );
}

export default AML;
