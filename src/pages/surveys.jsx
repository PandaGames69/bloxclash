import SurveysBanner from "../components/Surveys/surveysbanner";
import LiveEarns from "../components/LiveEarners/liveearns";
import Bets from "../components/Home/bets";
import {createResource, createSignal, For, Show} from "solid-js";
import {authedAPI} from "../util/api";
import Loader from "../components/Loader/loader";
import {useSearchParams} from "@solidjs/router";
import {Meta, Title} from "@solidjs/meta";
import SurveysWarning from "../components/Surveys/warning";
import SurveyIssues from "../components/Surveys/issues";

function Surveys(props) {

    let providersRef

    const [params, setParams] = useSearchParams()
    const [walls] = createResource(fetchWalls)
    const [warning, setWarning] = createSignal(!window.sessionStorage.getItem('surveys'))
    const [issues, setIssues] = createSignal(false)

    async function fetchWalls() {
        try {
            let res = authedAPI('/surveys/walls', 'GET')

            return res
        } catch (e) {
            console.error(e)

            return []
        }
    }

    function setWall(id) {
        if (params.wall === id) return setParams({wall: null})
        setParams({wall: id})
    }

    function getWall() {
        return (walls() || []).find(wall => wall?.id === params.wall)
    }

    function scrollProviders(direction) {
        providersRef.scrollBy({
            left: providersRef.clientWidth * direction,
            behavior: 'smooth'
        })
    }

    return (
        <>
            {warning() && props?.user && (
                <SurveysWarning close={() => {
                    window.sessionStorage.setItem('surveys', true)
                    setWarning(false)
                    setIssues(true)
                }}/>
            )}

            {issues() && (
                <SurveyIssues close={() => setIssues(false)}/>
            )}

            <Title>BloxClash | Surveys</Title>
            <Meta name='title' content='Surveys'></Meta>
            <Meta name='description' content='Don’t Have Robux? Don’t Worry, We Got you. Make Free Robux With Our Survey Providers.'></Meta>

            <div class='surveys-base-container'>
                <LiveEarns/>
                <SurveysBanner below={true}/>

                <div class='banner'>
                    <img src='/assets/icons/providers.svg' height='19' width='19' alt=''/>

                    <p class='title'>
                        <span class='white bold'>PROVIDERS</span>
                    </p>

                    <div class='line'/>

                    <button class='bevel-purple arrow' onClick={() => scrollProviders(-1)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"
                             fill="none">
                            <path d="M12 6L2 6M2 6L7.6 0.999999M2 6L7.6 11" stroke="white" stroke-width="2"/>
                        </svg>
                    </button>

                    <button class='bevel-purple arrow' onClick={() => scrollProviders(1)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"
                             fill="none">
                            <path d="M1.58933e-07 6L10 6M10 6L4.4 11M10 6L4.4 0.999999" stroke="white"
                                  stroke-width="2"/>
                        </svg>
                    </button>
                </div>

                <div class='providers' ref={providersRef}>
                    <Show when={!walls.loading} fallback={<Loader small={true} max='50px'/>}>
                        <For each={walls()}>{(wall) =>
                            <div class={'provider ' + (params.wall === wall.id ? 'active' : '')}
                                 onClick={() => setWall(wall.id)}>
                                <img src={`${import.meta.env.VITE_SERVER_URL}/public/walls/${wall?.id}.png`}
                                     height='40'/>
                            </div>
                        }</For>
                    </Show>
                </div>

                <div class='wall-container'>
                    {props?.user ? (
                        <>
                            {getWall() ? (
                                <iframe src={getWall().embed.replace('{userId}', props?.user.id)}/>
                            ) : (
                                <p>Please select an offerwall to get started.</p>
                            )}
                        </>
                    ) : (
                        <p>Login to complete surveys.</p>
                    )}
                </div>

                <Bets user={props?.user}/>
            </div>

            <style jsx>{`
              .surveys-base-container {
                width: 100%;
                max-width: 1175px;
                height: fit-content;

                box-sizing: border-box;
                padding: 30px 0;
                margin: 0 auto;
              }

              .banner {
                outline: unset;
                border: unset;

                width: 100%;
                height: 45px;

                border-radius: 5px;
                background: linear-gradient(90deg, rgb(104, 100, 164) -49.01%, rgba(90, 84, 149, 0.655) -5.08%, rgba(66, 53, 121, 0) 98.28%);

                padding: 0 15px;
                display: flex;
                align-items: center;
                gap: 12px;
              }

              .line {
                flex: 1;
                height: 1px;

                border-radius: 2525px;
                background: linear-gradient(90deg, #5A5499 0%, rgba(90, 84, 153, 0.00) 100%);
              }

              .arrow {
                margin-left: auto;

                width: 40px;
                height: 30px;

                display: flex;
                align-items: center;
                justify-content: center;

                cursor: pointer;
              }

              .providers {
                display: flex;
                gap: 10px;

                margin: 20px 0 30px 0;
                width: 100%;
                overflow: hidden;
              }

              .provider {
                min-width: 200px;
                height: 80px;

                display: flex;
                align-items: center;
                justify-content: center;

                border-radius: 8px;
                border: 1px solid rgba(134, 111, 234, 0.15);
                background: linear-gradient(0deg, rgba(64, 57, 118, 0.65) 0%, rgba(64, 57, 118, 0.65) 100%), radial-gradient(60% 60% at 50% 50%, rgba(147, 126, 236, 0.15) 0%, rgba(102, 83, 184, 0.15) 100%);

                cursor: pointer;
                transition: border .3s;
              }

              .provider.active {
                border: 1px solid #866FEA;
                background: #40397F;
                box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.10);
              }

              .wall-container {
                height: 510px;

                border-radius: 15px;
                background: #27224D;

                margin-bottom: 50px;
                overflow: hidden;
                
                display: flex;
                justify-content: center;
                align-items: center;
                color: #ADA3EF;
                
                text-align: center;
              }
              
              .wall-container iframe {
                width: 100%;
                height: 100%;
                
                outline: unset;
                border: unset;
              }

              @media only screen and (max-width: 1000px) {
                .surveys-base-container {
                  padding-bottom: 90px;
                }
              }
            `}</style>
        </>
    );
}

export default Surveys;
