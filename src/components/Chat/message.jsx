import Level from "../Level/level";
import Avatar from "../Level/avatar";
import {STAFF_ROLES} from "../../resources/users";
import {useSearchParams} from "@solidjs/router";
import {createSignal, For} from "solid-js";

function Message(props) {

    const [params, setParams] = useSearchParams()

    const tryToParseWord = (word) => {
        if (word[0] === '@' && word.length > 3) {
            return <span style={{ color: '#8F7FFF' }}>{word}&nbsp;</span>
        }

        if (word[0] === ':' || word[word.length - 1] === ':') {

            let emojiName = word.replaceAll(':', '').trim()
            let emoji = props?.emojis.find(emoji => emoji.name === emojiName)
            if (!emoji) return <>{word + ' '}</>

            return <><img style={{ 'vertical-align': 'bottom' }} src={emoji.url} height='24px' alt=''/>&nbsp;</>
        }

        return word + ' '
    }

    function wasMentioned() {
        if (!props?.actualUser) return false
        return props?.content?.includes(`@${props?.actualUser?.username}`)
    }

    return (
        <>
            <div class={'chatmessage-container ' + props?.user?.role + (wasMentioned() ? ' mentioned' : '')}>
                {props?.replyTo && (
                    <div className='replied'>
                        <img src='/assets/art/replybar.png' class='replybar'/>
                        <div class='replied-message' title={props?.repliedMessage}>
                            <For each={props?.repliedMessage?.split(' ')}>{(word) => tryToParseWord(word)}</For>
                        </div>
                    </div>
                )}

                <div class='user' onClick={() => setParams({ user: props?.user?.id })}>
                    {props?.user?.role === 'USER' || props?.user?.role === 'MOD' ? (
                        <Avatar id={props?.user?.id} xp={props?.user?.xp} height={30}/>
                    ) : (
                        <svg class='sword' xmlns="http://www.w3.org/2000/svg" width="33" height="25" viewBox="0 0 33 25" fill="none">
                            <path d="M15.4556 24.7344C15.3392 24.5869 15.2221 24.4398 15.1066 24.2917C14.6693 23.7303 14.2325 23.1687 13.7962 22.6067C13.7259 22.5162 13.7333 22.5481 13.7831 22.451C13.9569 22.1121 14.1333 21.7742 14.306 21.4349C14.3131 21.4162 14.3263 21.4003 14.3434 21.3899C14.3606 21.3795 14.3807 21.3752 14.4006 21.3776C14.6418 21.3801 14.8832 21.3787 15.1244 21.3787C15.1438 21.3787 15.163 21.3787 15.1824 21.3781C15.186 21.3784 15.1896 21.3779 15.1931 21.3767C15.1965 21.3754 15.1996 21.3735 15.2021 21.3709C15.2047 21.3683 15.2066 21.3651 15.2078 21.3617C15.209 21.3583 15.2094 21.3546 15.209 21.351C15.209 21.3341 15.2097 21.3172 15.2097 21.2999V19.4259C15.2091 19.4163 15.2091 19.4066 15.2097 19.397C15.2147 19.3576 15.1949 19.3459 15.1591 19.349C15.1399 19.3508 15.1205 19.349 15.1012 19.349C14.2036 19.349 13.306 19.3495 12.4085 19.3506C12.3829 19.3533 12.3571 19.348 12.3348 19.3353C12.3124 19.3226 12.2946 19.3033 12.2838 19.2799C11.8213 18.4666 11.3578 17.654 10.8933 16.8421C10.8831 16.8237 10.8741 16.8041 10.8618 16.7801C10.89 16.7717 10.9197 16.7692 10.949 16.7726C11.7573 16.7726 12.5656 16.7726 13.3738 16.7726C13.4825 16.7726 13.4704 16.7867 13.4704 16.6769C13.4704 12.2018 13.4701 7.72666 13.4695 3.25158C13.4682 3.22336 13.4728 3.19516 13.4831 3.16887C13.4935 3.14257 13.5093 3.11877 13.5295 3.09904C14.1741 2.42685 14.8173 1.75354 15.4592 1.0791C15.7856 0.73694 16.1117 0.394507 16.4375 0.0518009C16.4458 0.0430083 16.4539 0.034113 16.4625 0.0257294C16.4969 -0.00821398 16.4977 -0.00882725 16.5304 0.0239915C16.5713 0.0648872 16.611 0.107114 16.6509 0.149032C17.1437 0.665817 17.6364 1.1826 18.1291 1.69938C18.5853 2.17786 19.0416 2.65621 19.4979 3.13441C19.5114 3.1477 19.522 3.16366 19.5289 3.18127C19.5358 3.19888 19.539 3.21775 19.5381 3.23665C19.5369 3.68296 19.5366 4.12941 19.5373 4.57599C19.5373 8.60721 19.5373 12.6384 19.5373 16.6697C19.5373 16.789 19.5215 16.773 19.6405 16.7731C20.4199 16.7736 21.1993 16.7736 21.9786 16.7731H22.0604C22.0659 16.8053 22.0451 16.8249 22.0329 16.8463C21.7967 17.2612 21.56 17.6758 21.3228 18.0902C21.0968 18.4858 20.8697 18.881 20.6458 19.2779C20.6358 19.3016 20.6185 19.3214 20.5964 19.3347C20.5744 19.3479 20.5487 19.3538 20.5231 19.3515C19.64 19.3492 18.757 19.3487 17.874 19.3501C17.7731 19.3501 17.7836 19.3386 17.7836 19.4372C17.7836 20.0548 17.7836 20.6725 17.7836 21.29C17.7836 21.3069 17.7845 21.3238 17.7836 21.3412C17.7821 21.3686 17.7938 21.3802 17.8217 21.3799C17.8772 21.379 17.9327 21.3799 17.9882 21.3799C18.1861 21.3799 18.3838 21.3811 18.5818 21.379C18.5994 21.3772 18.6171 21.3811 18.6323 21.3901C18.6475 21.3992 18.6595 21.4129 18.6663 21.4292C18.8555 21.7792 19.0463 22.1283 19.2389 22.4765C19.251 22.4938 19.2567 22.5148 19.2548 22.5358C19.2529 22.5568 19.2437 22.5764 19.2286 22.5912C18.692 23.2861 18.1562 23.9815 17.6212 24.6775C17.6044 24.6993 17.5772 24.7168 17.5831 24.7508H17.5541C17.5302 24.7258 17.4995 24.7367 17.4723 24.7367C16.7995 24.7352 16.1272 24.7344 15.4556 24.7344Z"/>
                            <path d="M24.7485 24.7496C24.7621 24.7227 24.7383 24.7101 24.726 24.6951C24.5262 24.4596 24.3262 24.2244 24.1258 23.9897L22.9251 22.5788C22.8031 22.4356 22.6817 22.2918 22.5592 22.1494C22.4967 22.0764 22.5031 22.088 22.5424 22.0128C22.898 21.3336 23.2539 20.6545 23.6101 19.9755C24.1136 19.0144 24.6171 18.0534 25.1206 17.0923C25.2885 16.772 25.4565 16.4516 25.6248 16.1313C25.6549 16.074 25.6555 16.0739 25.6103 16.0267C25.3489 15.7527 25.0875 15.4786 24.826 15.2045C24.1805 14.5266 23.5348 13.8489 22.889 13.1713C22.8754 13.1565 22.8652 13.1389 22.8589 13.1198C22.8526 13.1007 22.8505 13.0805 22.8526 13.0605C22.8526 12.2329 22.8526 11.4054 22.8526 10.5779V5.42509C22.8798 5.4163 22.8879 5.4392 22.8996 5.45147C23.2379 5.80555 23.5758 6.15998 23.9135 6.51475C24.1897 6.8047 24.4658 7.09472 24.7417 7.38481C25.319 7.99143 25.8962 8.59774 26.4734 9.20374C26.8444 9.59327 27.2153 9.98294 27.5861 10.3727C28.175 10.9913 28.7639 11.6097 29.353 12.2281L30.7651 13.7116C31.3407 14.3162 31.9163 14.9208 32.4918 15.5252C32.6482 15.6895 32.8044 15.8539 32.9605 16.0184C33.0129 16.0734 33.0131 16.0734 32.9623 16.1269L31.7795 17.3692L30.0332 19.2028L28.6159 20.6914L26.8791 22.5156C26.405 23.0131 25.9309 23.5111 25.4568 24.0094C25.2406 24.2367 25.0248 24.4643 24.8095 24.6922C24.7947 24.7076 24.7648 24.7176 24.7775 24.7495L24.7485 24.7496Z"/>
                            <path d="M8.22927 24.7496C8.24175 24.733 8.22835 24.723 8.21905 24.7129C8.18653 24.6772 8.15365 24.6419 8.12039 24.6069C7.67939 24.1442 7.23829 23.6815 6.79708 23.2188C6.32105 22.7192 5.84525 22.2194 5.3697 21.7196L3.64315 19.906L2.21086 18.4016C1.73374 17.9 1.25633 17.3986 0.778664 16.8971C0.529196 16.6351 0.279866 16.3729 0.030671 16.1105C0.016038 16.0999 0.00526814 16.0848 0 16.0675C0.118191 15.9431 0.237608 15.8173 0.357843 15.6916L2.22497 13.7318C2.60265 13.3352 2.98022 12.9385 3.3577 12.5419C3.93331 11.9374 4.50889 11.3329 5.08444 10.7283C5.55516 10.2339 6.02591 9.73938 6.49669 9.24482L7.90895 7.76143C8.40135 7.2443 8.89377 6.72714 9.38623 6.20995C9.6207 5.96342 9.85507 5.71688 10.0893 5.47035C10.1072 5.44705 10.1296 5.42763 10.1552 5.4133V5.491C10.1552 8.01454 10.1556 10.538 10.1563 13.0615C10.1571 13.0839 10.1533 13.1062 10.1449 13.127C10.1366 13.1478 10.1239 13.1666 10.1078 13.1821C9.50456 13.8137 8.90209 14.4459 8.30043 15.0788C7.99937 15.395 7.69861 15.7116 7.39815 16.0285C7.35143 16.0778 7.35256 16.0675 7.3863 16.1322C7.76554 16.8562 8.14472 17.5803 8.52383 18.3044C9.02283 19.257 9.52187 20.2096 10.0209 21.1621C10.1731 21.4526 10.3255 21.7429 10.4781 22.0331C10.4886 22.0471 10.4935 22.0645 10.4919 22.0819C10.4903 22.0993 10.4823 22.1155 10.4695 22.1274C9.8833 22.8133 9.29823 23.5 8.7143 24.1875C8.57362 24.3527 8.43243 24.5176 8.29266 24.6838C8.27722 24.7023 8.24839 24.7167 8.25841 24.7495L8.22927 24.7496Z"/>
                            <path d="M15.4559 24.7343C16.1276 24.7343 16.7993 24.7347 17.471 24.7354C17.4987 24.7354 17.5293 24.7245 17.5528 24.7495H15.4539L15.4559 24.7343Z"/>
                        </svg>
                    )}

                    <p class='username'>
                        {props?.user?.role !== 'USER' && (
                            <span class='role'>{props?.user?.role}</span>
                        )}
                        &nbsp;
                        {props?.user?.username}
                    </p>

                    {props?.user?.role === 'USER' && (
                        <Level xp={props?.user?.xp}/>
                    )}

                    <p class='time' onClick={(e) => e.stopPropagation()}>{new Date(props?.createdAt)?.toLocaleTimeString()}</p>
                </div>

                <p class='message'>
                    <For each={props?.content?.split(' ')}>{(word) => tryToParseWord(word)}</For>

                    <span class='floaters'>
                        <img className='reply' src='/assets/icons/send.svg' height='16' width='16' onClick={() => {
                            if (props.replying === props.id) return props.setReplying(null)
                            props.setReplying(props.id)
                        }}/>

                        {STAFF_ROLES?.includes(props?.actualUser?.role) && (
                            <img class='trash' src='/assets/icons/trash.svg' height='16' width='16' onClick={() => {
                                if (!props?.ws?.connected) return
                                props?.ws?.emit('chat:sendMessage', `/delete ${props?.id}`)
                            }}/>
                        )}
                    </span>
                </p>
            </div>

            <style jsx>{`
              .chatmessage-container {
                width: 100%;
                height: fit-content;
              }

              .user {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
                white-space: nowrap;
                text-overflow: ellipsis;
                cursor: pointer;
              }

              .username {
                font-weight: 600;
                font-size: 14px;
                font-family: "Geogrotesque Wide", sans-serif;
                font-style: normal;
                color: white;
                margin-top: -2px;

                text-overflow: ellipsis;
                max-width: 140px;
                overflow: hidden;
              }

              .level {
                font-family: 'Geogrotesque Wide', sans-serif;
                font-weight: 700;
                font-size: 10px;
                color: white;

                background: #8F8DA1;
                padding: 3px 5px;
                border-radius: 3px;

                margin-top: -2px;

                display: flex;
                align-items: center;
                gap: 5px;
              }

              .level p {
                margin-top: -1px;
              }

              .message {
                font-weight: 500;
                font-size: 14px;
                color: #6E679E;
                background: var(--fourth-bg);
                border-radius: 3px;
                position: relative;

                word-break: break-word;
                white-space: pre-wrap;
                -moz-white-space: pre-wrap;

                padding: 12px;
              }
              
              .mentioned .message {
                background: rgba(143, 127, 255, 0.15) !important;
              }
              
              .floaters {
                position: absolute;
                cursor: pointer;

                display: flex;
                gap: 8px;
                
                top: auto;
                bottom: 12px;
                right: 12px;
              }
              
              .trash {
                cursor: pointer;
              }
              
              .reply {
                transform: scaleX(-1);
                cursor: pointer;
              }

              .time {
                font-family: 'Geogrotesque Wide';
                font-weight: 600;
                font-size: 11px;
                margin-left: auto;

                color: rgba(173, 163, 239, 0.65);
                cursor: initial;
              }
              
              .replied {
                position: relative;
                
                width: 100%;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                
                margin-bottom: 10px;
              }
              
              .replied-message {
                width: 220px;
                height: 35px;
                
                display: flex;
                align-items: center;

                white-space: nowrap;
                overflow: hidden;
                
                border-radius: 3px;
                background: rgba(143, 127, 255, 0.15);

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 11px;
                font-weight: 500;
                
                padding: 0 10px;
              }
              
              .replybar {
                position: absolute;
                top: 10px;
                left: 0;
              }
              
              .OWNER .message, .ADMIN .message {
                background: linear-gradient(37deg, rgba(255, 153, 0, 0.15) 30.03%, rgba(249, 172, 57, 0.15) 42.84%);
                color: #FCA31E;
              }
              
              .MOD .message {
                background: rgba(89, 232, 120, 0.05);
                color: #59E878;
              }
              
              .DEV .message {
                background: rgba(249, 115, 57, 0.15);
                color: #F97339;
              }
              
              .role {
                font-size: 14px;
                font-weight: 700;
              }
              
              .ADMIN .role, .OWNER .role, .OWNER .sword, .ADMIN .sword {
                color: var(--gold);
                fill: var(--gold);
              }
              
              .DEV .role, .DEV .sword {
                color: #F97339;
                fill: #F97339;
              }
              
              .MOD .role, .MOD .role {
                color: #59E878;
                fill: #59E878;
              }
            `}</style>
        </>
    );
}

export default Message;
