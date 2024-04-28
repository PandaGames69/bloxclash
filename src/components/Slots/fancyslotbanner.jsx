import {A} from "@solidjs/router";
import GameInfo from "../Home/gameinfo";

function FancySlotBanner(props) {
  return (
    <>
      <div className='slot'>
        <div style={{ 'background-image': `url(${import.meta.env.VITE_SERVER_URL}${props?.img})`}} class='banner'/>

        <div class='info'>
          <div class='title'>
            <p>{props?.name}</p>
            <p className='provider'>{props?.providerName}</p>
          </div>

          <GameInfo type='RTP' rtp={props?.rtp || 100}/>
        </div>

        <A href={`/slots/${props.slug}`} class='gamemode-link'/>
      </div>

      <style jsx>{`
        .slot {
          min-width: 140px;
          width: 140px;
          min-height: 235px;
          border-radius: 6px;
          
          display: flex;
          flex-direction: column;
          overflow: hidden;

          position: relative;
        }
        
        .banner {
          width: 100%;
          height: 100%;
          
          background-position: center;
          background-size: 100%;
          transition: background .3s;
        }
        
        .slot:hover .banner {
          background-size: 105%;
        }
        
        .info {
          width: 100%;
          min-height: 65px;
          
          border-radius: 0px 0px 6px 6px;
          border: 1px solid rgba(134, 111, 234, 0.15);
          background: linear-gradient(0deg, rgba(71, 64, 126, 0.83) 0%, rgba(71, 64, 126, 0.83) 100%), radial-gradient(60% 60% at 50% 50%, rgba(147, 126, 236, 0.15) 0%, rgba(102, 83, 184, 0.15) 100%);
          
          display: flex;
          align-items: center;
          gap: 12px;
          
          padding: 0 12px;
        }
        
        .title {
          color: #FFF;
          font-size: 17px;
          font-weight: 800;
          text-transform: capitalize;
          
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        
        .provider {
          color: #9189D3;
          font-size: 16px;
          font-weight: 600;
        }
      `}</style>
    </>
  );
}

export default FancySlotBanner;
