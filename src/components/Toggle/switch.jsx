function Switch(props) {

    function colorScheme() {
        if (props?.ultradark) return 'ultra'
        if (props?.dark) return 'dark'
        return ''
    }

    return (
        <>
            <div class={'switch ' + (props.active ? 'active ' : '') + colorScheme()} onClick={() => props.toggle()}>
                <div class='dot'/>
            </div>

            <style jsx>{`
                .switch {
                  width: 31px;
                  height: 11px;

                  border-radius: 3px;
                  background: rgba(90, 84, 153, 0.35);
                  
                  display: flex;
                  align-items: center;
                  
                  cursor: pointer;
                  position: relative;
                }
                
                .dark {
                  background: #2B284E;
                }
                
                .ultra {
                  background: #1E1B3A;
                }
                
                .dark.active, .ultra.active {
                  background: rgba(89, 232, 120, 0.25);
                }
                
                .dark.active .dot, .ultra.active .dot {
                  background: #59E878;
                }
                
                .dot {
                  width: 17px;
                  height: 17px;
                  
                  border-radius: 3px;
                  background: #5A5499;
                  
                  position: absolute;
                  transition: left .3s;
                  left: 0;
                }
                
                .switch.active .dot {
                  left: 50%;
                }
            `}</style>
        </>
    )
}

export default Switch