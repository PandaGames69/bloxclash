import {createResource, Show} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";
import Loader from "../Loader/loader";
import LineChart from "./linechart";
import AdminMFA from "../MFA/adminmfa";

function AdminDashboard(props) {

    const [stats, { mutate: mutateStats, refetch: refetchStats }] = createResource(fetchStats)

    async function fetchStats() {
        try {
            let stats = await authedAPI(`/admin/dashboard`, 'GET', null)
            if (stats.error && stats.error === '2FA_REQUIRED') {
                return mutateStats({ mfa: true })
            }

            if (stats.growth) {
                stats.growth = stats.growth.reverse()
            }

            return mutateStats(stats)
        } catch (e) {
            console.log(e)
            return mutateStats(null)
        }
    }

    return (
        <>
            {stats()?.mfa && (
                <AdminMFA refetch={() => refetchStats()}/>
            )}

            <Show when={!stats.loading} fallback={<Loader/>}>
                <div className='stats'>
                    <div className='stat'>
                        <p className='white align'>
                            $
                            {(stats()?.profit?.lastDay || 0)?.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>
                        <p>PROFIT ON DAY</p>
                    </div>

                    <div className='stat'>
                        <p className='white align'>
                            $
                            {(stats()?.profit?.last7d || 0)?.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>
                        <p>PROFIT ON WEEK</p>
                    </div>

                    <div className='stat'>
                        <p className='white align'>
                            $
                            {(stats()?.profit?.last31d || 0)?.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>
                        <p>PROFIT ON MONTH</p>
                    </div>

                    <div className='stat green'>
                        <p className='white align'>
                            $
                            {((stats()?.profit?.total) || 0)?.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>
                        <p class='green'>OVERALL PROFIT</p>
                    </div>
                </div>
            </Show>

            <div class='bar' style={{margin: '30px 0 10px 0'}}/>

            <div className='banner'>
                <img src='/assets/icons/logoswords.png' width='25' height='19' alt=''/>
                <p>GROWTH</p>
                <div className='line'/>
            </div>

            <div class='graph'>
                <Show when={!stats.loading} fallback={<Loader/>}>
                    <LineChart data={stats()?.growth || []}/>
                </Show>
            </div>

            <div className='banner'>
                <img src='/assets/icons/logoswords.png' width='25' height='19' alt=''/>
                <p>DEMOGRAPHIC</p>
                <div className='line'/>
            </div>

            <div class='demographics'>

            </div>

            <style jsx>{`
              .stats {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }

              .stat {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                gap: 10px;

                flex: 1 1 0;
                height: 90px;

                border-radius: 5px;
                background: rgba(90, 84, 153, 0.27);

                color: #FFF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 20px;
                font-weight: 600;

                padding: 10px 20px;
              }

              .stat.green {
                background: rgba(89, 232, 120, 0.15);
              }

              .stat p:last-child {
                color: #ADA3EF;
                font-size: 13px;
                font-weight: 600;
              }

              .align {
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .green {
                color: #59E878 !important;
              }

              .bar {
                width: 100%;
                height: 1px;
                min-height: 1px;
                background: #5A5499;
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

                color: white;
                font-size: 22px;
                font-weight: 600;

                margin-bottom: 30px;
              }

              .line {
                flex: 1;
                height: 1px;

                border-radius: 2525px;
                background: linear-gradient(90deg, #5A5499 0%, rgba(90, 84, 153, 0.00) 100%);
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

                color: white;
                font-size: 22px;
                font-weight: 600;

                margin: 35px 0;
              }

              .line {
                flex: 1;
                height: 1px;

                border-radius: 2525px;
                background: linear-gradient(90deg, #5A5499 0%, rgba(90, 84, 153, 0.00) 100%);
              }
              
              .graph {
                width: 100%;
                height: 235px;

                border-radius: 15px;
                background: #2D2755;
              }
            `}</style>
        </>
    );
}

export default AdminDashboard;
