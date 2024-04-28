import {Outlet} from "@solidjs/router";
import Livedrops from "../components/LiveDrops/livedrops";
import {Meta, Title} from "@solidjs/meta";

function Cases(props) {
    return (
        <>
            <Title>BloxClash | Cases</Title>
            <Meta name='title' content='Cases'></Meta>
            <Meta name='description' content='Win Roblox Limiteds And Robux on BloxClash With The Loot Cases In Roblox!'></Meta>

            <div class='cases-base-container'>
                <Livedrops/>

                <Outlet/>
            </div>

            <style jsx>{`
              .cases-base-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }
              
              @media only screen and (max-width: 1000px) {
                .cases-base-container {
                  padding-bottom: 90px;
                }
              }
            `}</style>
        </>
    );
}

export default Cases;
