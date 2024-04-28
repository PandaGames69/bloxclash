
function Pagination(props) {
    return (
        <>
            <div className='pagination'>
                <button disabled={props?.page <= 1 || props?.isLoading} onClick={async () => {
                    props?.setPage(page => page - 1)

                    if (!props?.loadedPages.has(props?.page))
                        await props?.loadPage()
                    else
                        props?.setParams({ page: props?.page })
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="5" height="9" viewBox="0 0 5 9" fill="none">
                        <path
                            d="M-9.00013e-07 4.49999C-9.01936e-07 4.33869 0.0599423 4.17741 0.179578 4.05443L3.94614 0.184628C4.18574 -0.0615425 4.57422 -0.0615425 4.81372 0.184628C5.05322 0.430698 4.99335 0.642857 4.99335 1.07593L4.99335 4.49999L4.99335 7.71429C4.99335 8.35714 5.05311 8.56923 4.8136 8.81528C4.5741 9.06157 4.18563 9.06157 3.94603 8.81528L0.179461 4.94554C0.0598064 4.8225 -8.9809e-07 4.66122 -9.00013e-07 4.49999Z"
                            fill="#ADA3EF"/>
                    </svg>
                    PREV
                </button>

                <p>
                    PAGE&nbsp;
                    <span className='white'>{props?.page}</span>
                    /{props?.total || 1}
                </p>

                <button disabled={props?.page >= props?.total || props?.isLoading} onClick={async () => {
                    props?.setPage(page => page + 1)

                    if (!props?.loadedPages.has(props?.page))
                        await props?.loadPage()
                    else
                        props?.setParams({ page: props?.page })
                }}>
                    NEXT

                    <svg xmlns="http://www.w3.org/2000/svg" width="5" height="9" viewBox="0 0 5 9" fill="none">
                        <path
                            d="M5 4.50001C5 4.66131 4.94006 4.82259 4.82042 4.94557L1.05386 8.81537C0.814256 9.06154 0.425785 9.06154 0.186281 8.81537C-0.0532221 8.5693 0.00665164 8.35714 0.00665381 7.92407L0.00665385 4.50001L0.0066548 1.28571C0.00665481 0.642857 -0.0531055 0.430768 0.186398 0.184717C0.425901 -0.0615721 0.814372 -0.0615721 1.05397 0.184717L4.82054 4.05446C4.94019 4.1775 5 4.33878 5 4.50001Z"
                            fill="#ADA3EF"/>
                    </svg>
                </button>
            </div>

            <style jsx>{`
              .pagination {
                width: 100%;

                color: #ADA3EF;
                font-family: "Noto Sans", sans-serif;
                font-size: 14px;
                font-weight: 900;

                display: flex;
                align-items: center;
                justify-content: space-between;
              }

              .pagination button {
                outline: unset;
                border: unset;

                width: 78px;
                height: 40px;

                border-radius: 3px;
                background: #423E76;
                box-shadow: 0px 1px 0px 0px #2E2855, 0px -1px 0px 0px #4B4783;
                cursor: pointer;

                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;

                color: #ADA3EF;
                font-family: "Geogrotesque Wide", sans-serif;
                font-size: 15px;
                font-weight: 700;
              }
            `}</style>
        </>
    );
}

export default Pagination;
