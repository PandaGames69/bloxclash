function SpinnerDecoration(props) {
  return (
    <>
      <svg class={'dec ' + props?.type + ' ' + props.color} xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 23 375" fill="none">
        <path className='dec' opacity="0.47"
              d="M1 375V213.414C1 212.685 1.26538 211.981 1.74655 211.434L21.2767 189.211C22.2647 188.086 22.273 186.406 21.296 185.272L1.72723 162.56C1.25807 162.015 1 161.32 1 160.601V0"/>
        <defs>
          <linearGradient id="gold" x1="12" y1="0" x2="12" y2="375"
                          gradientUnits="userSpaceOnUse">
            <stop stop-color="#7B5532" stop-opacity="0"/>
            <stop offset="0.494577" stop-color='#FFBA00'/>
            <stop offset="1" stop-color="#CE9D18" stop-opacity="0"/>
          </linearGradient>

          <linearGradient id="silver" x1="12" y1="0" x2="12" y2="375"
                          gradientUnits="userSpaceOnUse">
            <stop stop-color="#7B5532" stop-opacity="0"/>
            <stop offset="0.494577" stop-color="#9296D6"/>
            <stop offset="1" stop-color="#CE9D18" stop-opacity="0"/>
          </linearGradient>

          <linearGradient id="green" x1="11" y1="0" x2="11" y2="375" gradientUnits="userSpaceOnUse">
            <stop stop-color="#7B5532" stop-opacity="0"/>
            <stop offset="0.494577" stop-color="#59E878"/>
            <stop offset="1" stop-color="#CE9D18" stop-opacity="0"/>
          </linearGradient>

          <linearGradient id="red" x1="12" y1="0" x2="12" y2="375" gradientUnits="userSpaceOnUse">
            <stop stop-color="#7B5532" stop-opacity="0"/>
            <stop offset="0.494577" stop-color="#F95151"/>
            <stop offset="1" stop-color="#CE9D18" stop-opacity="0"/>
          </linearGradient>
        </defs>
      </svg>

      <style jsx>{`
        .dec {
          stroke: url(#silver);
        }

        .gold .dec {
          stroke: url(#gold);
        }

        .green .dec {
          stroke: url(#green);
        }

        .red .dec {
          stroke: url(#red);
        }

        .right-dec {
          height: 100%;
          position: absolute;
          transform: rotate(180deg);
          right: 10px;
        }

        .left-dec {
          height: 100%;
          position: absolute;
          left: 10px;
        }

        @media only screen and (max-width: 1040px) {
          .left-dec, .right-dec {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

export default SpinnerDecoration;
