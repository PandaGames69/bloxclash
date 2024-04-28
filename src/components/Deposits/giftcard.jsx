import {createSignal, For} from "solid-js";
import {authedAPI, createNotification} from "../../util/api";

const CARDS = {
    'g2a': [
        { img: '/assets/art/g2a3.png', link: 'https://www.g2a.com/bloxclash-gift-card-3-usd-bloxclash-key-global-i10000500684001' },
        { img: '/assets/art/g2a5.png', link: 'https://www.g2a.com/bloxclash-gift-card-5-usd-bloxclash-key-global-i10000500684002' },
        { img: '/assets/art/g2a10.png', link: 'https://www.g2a.com/bloxclash-gift-card-10-usd-bloxclash-key-global-i10000500684003' },
        { img: '/assets/art/g2a25.png', link: 'https://www.g2a.com/bloxclash-gift-card-25-usd-bloxclash-key-global-i10000500684004' },
        { img: '/assets/art/g2a50.png', link: 'https://www.g2a.com/bloxclash-gift-card-50-usd-bloxclash-key-global-i10000500684005' },
        { img: '/assets/art/g2a100.png', link: 'https://www.g2a.com/bloxclash-gift-card-100-usd-bloxclash-key-global-i10000500684006' },
        { img: '/assets/art/g2a250.png', link: 'https://www.g2a.com/bloxclash-gift-card-250-usd-bloxclash-key-global-i10000500684007' },
        { img: '/assets/art/g2a500.png', link: 'https://www.g2a.com/bloxclash-gift-card-500-usd-bloxclash-key-global-i10000500684008' },
    ],

    'kinguin': [
        { img: '/assets/art/kinguin3.png', link: 'https://www.kinguin.net/category/186314/bloxclash-3-gift-card' },
        { img: '/assets/art/kinguin5.png', link: 'https://www.kinguin.net/category/186853/bloxclash-5-gift-card' },
        { img: '/assets/art/kinguin10.png', link: 'https://www.kinguin.net/category/186854/bloxclash-10-gift-card' },
        { img: '/assets/art/kinguin25.png', link: 'https://www.kinguin.net/category/186855/bloxclash-25-gift-card' },
        { img: '/assets/art/kinguin50.png', link: 'https://www.kinguin.net/category/186856/bloxclash-50-gift-card' },
        { img: '/assets/art/kinguin100.png', link: 'https://www.kinguin.net/category/186857/bloxclash-100-gift-card' },
        { img: '/assets/art/kinguin250.png', link: 'https://www.kinguin.net/category/186858/bloxclash-250-gift-card' },
        { img: '/assets/art/kinguin500.png', link: 'https://www.kinguin.net/category/186859/bloxclash-500-gift-card' },
    ]
}

function GiftcardDeposit(props) {

    const [code, setCode] = createSignal('')

    return (
        <>
            <div class='giftcard-container'>
                <div class='deposit-header'>
                    <p class='type'>You have selected <span class='gold'>{props?.name}</span></p>

                    <div class='code-container'>
                        <input className='text' placeholder='ENTER CODE HERE' value={code()} onInput={(e) => setCode(e.target.value)}/>
                        <button class='bevel-gold redeem' onClick={async () => {
                            let res = await authedAPI('/trading/deposit/giftcards/redeem', 'POST', JSON.stringify({
                                code: code()
                            }), true)

                            if (res.success) {
                                createNotification('success', 'Successfully redeemed your giftcard.')
                            }
                        }}>REDEEM</button>
                    </div>
                </div>

                <div class='bar' style={{margin: '15px 0 30px 0'}}/>

                <div class='cards'>
                    <For each={CARDS[props?.type] || []}>{(card, index) =>
                        <div class='card' style={{ 'background-image': `url(${card?.img})`}} onClick={() => window.open(card?.link, '_blank')}/>
                    }</For>
                </div>
            </div>

            <style jsx>{`
              .giftcard-container {
                width: 100%;
                height: fit-content;

                display: flex;
                flex-direction: column;

                padding: 25px 50px;
              }

              .deposit-header {
                display: flex;
                justify-content: space-between;
                width: 100%;

                color: #ADA3EF;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 13px;
                font-weight: 600;

                gap: 8px;
              }

              .bar {
                flex: 1;
                height: 1px;
                min-height: 1px;
                background: #4B4887;
              }
              
              .cards {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(255px, 1fr));
                grid-gap: 10px;
              }
              
              .card {
                height: 145px;
                background-position: center;
                background-size: 100% 100%;
                cursor: pointer;
                transition: background .3s;
                border-radius: 10px;
              }
              
              .card:hover {
                background-size: 102% 102%;
              }
              
              .code-container {
                width: 100%;
                max-width: 390px;
                height: 30px;
                
                display: flex;
                align-items: center;
                
                border-radius: 3px;
                border: 1px solid #423B74;
                background: #302B56;
                
                padding: 6px 6px 6px 12px;
              }
              
              .code-container input {
                width: 100%;
                height: 100%;
                border: unset;
                outline: unset;
                background: unset;

                color: white;
                font-family: Geogrotesque Wide, sans-serif;
                font-size: 11px;
                font-weight: 600;
              }
              
              .code-container input::placeholder {
                color: #ADA3EF;
              }
              
              .redeem {
                font-size: 12px;
              }

              @media only screen and (max-width: 500px) {
                .giftcard-container {
                  padding: 12px;
                }
              }
            `}</style>
        </>
    );
}

export default GiftcardDeposit;
