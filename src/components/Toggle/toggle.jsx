function Toggle(props) {
    return (
        <>
            <div class={'toggle ' + (props.active ? 'active' : '')} onClick={() => props.toggle()}>
                <svg width="9" height="7" viewBox="0 0 9 7" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M3.44629 6.86513C3.36035 6.95167 3.24317 7 3.12139 7C2.99962 7 2.88244 6.95167 2.7965 6.86513L0.201966 4.26582C-0.0673219 3.99609 -0.0673219 3.5588 0.201966 3.28953L0.526857 2.9641C0.796145 2.69436 1.23224 2.69436 1.50153 2.9641L3.12139 4.58665L7.49847 0.202302C7.76776 -0.0674338 8.20431 -0.0674338 8.47314 0.202302L8.79803 0.527733C9.06732 0.797469 9.06732 1.23475 8.79803 1.50403L3.44629 6.86513Z"/>
                </svg>
            </div>

            <style jsx>{`
                .toggle {
                  width: 19px;
                  height: 19px;

                  background: #302E5A;
                  border: 1px solid #383666;
                  border-radius: 3px;
                  
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  
                  cursor: pointer;
                  transition: all .3s;
                }
                
                .toggle svg {
                  fill: #302E5A;
                  transition: fill .3s;
                }
                
                .toggle.active {
                  background: rgba(89, 232, 120, 0.25);
                  border: 1px solid rgba(89, 232, 120, 1);
                }
                
                .toggle.active svg {
                  fill: #59E878;
                }
            `}</style>
        </>
    )
}

export default Toggle