
function NumberPrefix(props) {
    return (
        <>
            {props?.amount >= 0 ? (
                <p class='won'>+</p>
            ) : (
                <p class='loss'>-</p>
            )}

            <style jsx>{`
              .won {
                width: 17px;
                height: 17px;
                text-align: center;
                line-height: 17px;
                background: rgba(89, 232, 120, 0.15);
                color: #59E878;
                font-weight: 600;
                border-radius: 2px;
              }

              .loss {
                width: 17px;
                height: 17px;
                text-align: center;
                line-height: 17px;
                background: rgba(232, 89, 89, 0.15);
                color: #E85959;
                font-weight: 600;
                border-radius: 2px;
              }
            `}</style>
        </>
    );
}

export default NumberPrefix;
