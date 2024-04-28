function CaseTitle(props) {
    return (
        <>
            <div class={'title ' + (props.full ? 'full' : '')}>
                <p>{props.name}</p>
            </div>

            <style jsx>{`
              .title {
                width: 166px;
                min-height: 30px;
                
                border-radius: 5px;
                background: linear-gradient(185deg, rgba(75, 72, 135, 0), rgba(75, 72, 135, 0) 15%, rgba(75, 72, 135, 0.051) 20%, rgba(75, 72, 135, 1) 100%);

                color: #AEA4E4;
                font-size: 13px;
                font-weight: 600;
                
                text-align: center;
                line-height: 30px;
                position: relative;
                z-index: 0;
              }
              
              .full {
                flex: 1;
              }
              
              .title:before {
                position: absolute;
                left: 1px;
                top: 1px;
                
                z-index: -1;
                height: 28px;
                width: calc(100% - 2px);
                
                content: '';
                border-radius: 5px;
                background: linear-gradient(0deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.4) 100%), radial-gradient(385.21% 305.21% at 3.46% 224.40%, rgba(156, 78, 255, 0.35) 0%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(222deg, rgba(69, 65, 122, 0.65) 0%, rgba(43, 40, 80, 0.00) 100%);
              }
            `}</style>
        </>
    );
}

export default CaseTitle;
