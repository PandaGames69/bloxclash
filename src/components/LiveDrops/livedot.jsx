function LiveDot(props) {
    return (
        <>
            <div class={'dot ' + (props.type || 'green')}/>

            <style jsx>{`
              .dot {
                width: 10px;
                height: 10px;
                background: gray;
                border-radius: 50%;
                position: relative;
                
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .dot:after {
                width: 4px;
                height: 4px;
                border-radius: 50%;
                content: '';
                position: absolute;
              }
              
              .dot.green {
                background: linear-gradient(rgba(69, 208, 66, 0.25), rgba(166, 253, 232, 0.25));
              }
              
              .dot.green:after {
                background: linear-gradient(rgba(69, 208, 66, 1), rgba(166, 253, 232, 1));
              }
              
              .dot.gold {
                background: linear-gradient(rgba(255, 153, 0, 0.25), rgba(249, 172, 57, 0.25));
              }
              
              .dot.gold:after {
                background: linear-gradient(rgba(255, 153, 0, 1), rgba(249, 172, 57, 1));
              }
            `}</style>
        </>
    );
}

export default LiveDot;
