import {authedAPI, createNotification} from "../../util/api";

function RobuxTX(props) {
    return (
        <>
            <div className='tx'>
                <div className='robux'>
                    {props?.status === 'pending' && (
                        <svg class='cancel' xmlns="http://www.w3.org/2000/svg" width="14" height="15" viewBox="0 0 14 15" fill="none" onClick={async () => {
                            let res = await authedAPI(`/trading/robux/cancel/${props?.id}`, 'POST', null, true)

                            if (res.success) {
                                props?.cancel(props?.id)
                                createNotification('success', 'Successfully cancelled your Robux transaction.')
                            }
                        }}>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M4.37542 0C4.01552 0 3.72376 0.298038 3.72376 0.66568V1.99704H0.651658C0.29176 1.99704 0 2.29508 0 2.66272C0 3.03036 0.29176 3.3284 0.651658 3.3284H12.4436C12.8035 3.3284 13.0952 3.03036 13.0952 2.66272C13.0952 2.29508 12.8035 1.99704 12.4436 1.99704H9.43354V0.66568C9.43354 0.298038 9.1418 0 8.78189 0H4.37542ZM5.02708 1.90194V1.33136H8.13023V1.90194H5.02708Z" fill="#8984C5"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.7299 4.65979H1.30331V12.0932C1.30331 13.5222 2.3785 14.645 3.77962 14.645H9.25355C10.6547 14.645 11.7299 13.5222 11.7299 12.0932V4.65979ZM5.64773 7.00525C5.64773 6.63766 5.35592 6.33957 4.99605 6.33957C4.63614 6.33957 4.34439 6.63766 4.34439 7.00525V11.4431C4.34439 11.8108 4.63614 12.1088 4.99605 12.1088C5.35592 12.1088 5.64773 11.8108 5.64773 11.4431V7.00525ZM8.75086 7.00525C8.75086 6.63766 8.45912 6.33957 8.0992 6.33957C7.73929 6.33957 7.44755 6.63766 7.44755 7.00525V11.4431C7.44755 11.8108 7.73929 12.1088 8.0992 12.1088C8.45912 12.1088 8.75086 11.8108 8.75086 11.4431V7.00525Z" fill="#8984C5"/>
                        </svg>
                    )}
                    <p className='gold bold'>ROBUX</p>
                </div>

                <div>
                    <p>{new Date(props.createdAt)?.toLocaleString()}</p>
                </div>

                <div>
                    <img src='/assets/icons/coin.svg' height='17' width='17' alt=''/>
                    {typeof props?.filledAmount === 'number' ? (
                        <p className='white bold'>{props?.filledAmount} / <span className='gray'>{props?.totalAmount}</span>
                        </p>
                    ) : (
                        <p className='white bold'>{props?.totalAmount}</p>
                    )}
                </div>

                <div>
                    <p>{props?.status === 'pending' ? `#${props?.queuePosition} QUEUE` : '-'}</p>
                </div>

                <div>
                    <p className={props?.status}>{props?.status}</p>
                </div>
            </div>

            <style jsx>{`

              .tx {
                width: 100%;
                min-height: 55px;

                padding: 16px 20px;

                display: flex;
                align-items: center;
                justify-content: center;
                flex-wrap: wrap;

                background: rgba(90, 84, 153, 0.27);

                color: #ADA3EF;
                font-size: 14px;
                font-weight: 600;

                gap: 8px 0;
                overflow: hidden;
              }

              .tx div {
                flex: 1;
                display: flex;
                gap: 8px;
                justify-content: center;
                align-items: center;
                white-space: nowrap;
              }

              .robux {
                display: flex;
                justify-content: flex-start !important;
                align-items: center;
                gap: 8px;
              }

              .cancel {
                cursor: pointer;
              }

              .tx div:nth-of-type(5n) {
                justify-content: flex-end;
              }

              .pending {
                text-transform: uppercase;
                color: #FCA31E;
              }

              .complete {
                text-transform: uppercase;
                color: #24DD4C;
              }

              .failed, .cancelled {
                color: #E85959;
                text-transform: uppercase;
              }
            `}</style>
        </>
    );
}

export default RobuxTX;
