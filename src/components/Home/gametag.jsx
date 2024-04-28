function GameTag(props) {
    return (
        <>
            <div class={'tag-container ' + props?.tag}>
                <p>{props.tag}</p>
            </div>

            <style jsx>{`
                .tag-container {
                  width: 36px;
                  height: 17px;
                  
                  display: flex;
                  align-items: center;
                  justify-content: center;

                  border-radius: 3px;
                  
                  color: #FFF;
                  font-family: "Geogrotesque Wide";
                  font-size: 12px;
                  font-weight: 700;
                  text-transform: uppercase;
                }
                
                .hot {
                  background: #F97339;
                  box-shadow: 0px 1px 0px 0px #B9562B, 0px -1px 0px 0px #FFA57D;
                }
                
                .new {
                  color: #59E878;
                  background: rgba(89, 232, 120, 0.43);
                }
                
                p { 
                  margin-top: -2px;
                }
            `}</style>
        </>
    );
}

export default GameTag;
