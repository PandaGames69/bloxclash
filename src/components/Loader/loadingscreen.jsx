function LoadingScreen(props) {
    return (
        <>
            <div class='loader-container'>
                <img src='/assets/logo/blox-clash-logo.gif' height='180'/>
                <img src='/assets/logo/blox-clash-words.png' height='47'/>

                <div class='progress-container'>
                    <div class='progress-bar'/>
                    <div class='progress-bar'/>
                    <div class='progress-bar'/>
                    <div class='progress-bar'/>
                    <div class='progress-bar'/>
                    <div class='progress-bar'/>
                    <div class='progress-bar'/>
                </div>

                <div className='background'/>
            </div>

            <style jsx>{`
              .loader-container {
                height: 100vh;
                width: 100vw;
                
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 30px;
              }

              .progress-container {
                width: 300px;
                display: flex;
                gap: 7px;
              }
              
              .progress-bar {
                background: #262342;
                flex: 1;
                height: 10px;
                position: relative;
                overflow: hidden;
              }
              
              .progress-bar:before {
                width: 100%;
                height: 100%;
                position: absolute;
                left: -100%;
                top: 0;
                background: linear-gradient(37deg, #F90 30.03%, #F9AC39 42.84%), #262342;
                content: '';
                animation: fill 2.4s linear infinite;
              }
              
              .progress-bar:nth-child(2):before {
                animation-delay: .2s;
              }

              .progress-bar:nth-child(3):before {
                animation-delay: .4s;
              }

              .progress-bar:nth-child(4):before {
                animation-delay: .6s;
              }

              .progress-bar:nth-child(5):before {
                animation-delay: .8s;
              }

              .progress-bar:nth-child(6):before {
                animation-delay: 1s;
              }

              .progress-bar:nth-child(7):before {
                animation-delay: 1.2s;
              }

              .background {
                position: absolute;
                max-width: 1500px;
                width: 100%;
                top: 0;
                left: 50%;
                transform: translateX(-50%);

                height: 100%;
                width: 100%;

                background-image: url("/assets/art/background.png");
                mix-blend-mode: luminosity;
                z-index: -1;

                background-repeat: no-repeat;
                background-position: center;
                background-size: contain;
              }

              @keyframes fill {
                0% {
                  left: -100%;
                }
                7.21% {
                  left: 0%;
                }
                50% {
                  left: 0%;
                }
                57.21% {
                  left: 100%;
                }
                100% {
                  left: 100%;
                }
              }
            `}</style>
        </>
    );
}

export default LoadingScreen;
