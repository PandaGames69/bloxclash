function SystemMessage(props) {
    return (
        <>
            <div class='chatmessage-container'>
                <div class='user'>
                    <div class='avatar'>
                        <img src='/assets/icons/orangesword.png' alt='' height='25'/>
                    </div>

                    <p class='username'>BOT</p>
                    <p class='time'>{new Date(props?.createdAt)?.toLocaleTimeString()}</p>
                </div>

                <p class='message'>{props?.content}</p>
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
              }
              
              .avatar img {
                border-radius: 3px;
                position: relative;
              }
              
              .avatar {
                position: relative;
                padding: 1px;
                box-sizing: content-box;
              }
              
              .username {
                font-weight: 600;
                font-size: 14px;
                font-family: "Geogrotesque Wide", sans-serif;
                font-style: normal;
                color: #F97339;
                margin-top: -2px;
              }
              
              .message {
                font-weight: 500;
                font-size: 14px;
                color: #F97339;
                background: rgba(249, 115, 57, 0.15);
                border-radius: 3px;

                padding: 12px;
              }
              
              .time {
                font-family: 'Geogrotesque Wide';
                font-weight: 600;
                font-size: 11px;
                margin-left: auto;

                color: rgba(173, 163, 239, 0.65);
              }
            `}</style>
        </>
    );
}

export default SystemMessage;
