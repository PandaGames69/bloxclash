const { JsonRpc, Api, RpcError } = require('eosjs');
const fetch = require('node-fetch'); // node only
const rpc = new JsonRpc('http://eos.greymass.com', { fetch });

async function getEOSBlockNumber() {
    try {
        const info = await rpc.get_info();
        return info.head_block_num;
    } catch (error) {
        console.error('Error in getNextEOSBlockNumber:', error);
    }
}

async function waitForEOSBlock(blockNumber) {
    let block;
    let retries = 0;

    do {
        try {
            block = await rpc.get_block(blockNumber);
        } catch (error) {
            retries++;
            if (retries > 10) {
                console.error(`Error in waitForEOSBlock ${blockNumber}:`, error);
                throw error;
            }
            // console.error(`Block ${blockNumber} not yet available, retrying...`);
            // Wait for a bit before checking again
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } while (!block);
    
    // console.log(`Block ${blockNumber} has been reached and its hash is ${block.id}`);
    return block.id; // return the block hash
}


// (async () => {
//     const blockNumber = await getEOSBlockNumber();
//     const commitTo = blockNumber + 2;

//     console.log(`Block number is ${blockNumber}`);

//     const blockHash = await waitForEOSBlock(commitTo);
//     console.log(`Block ${commitTo} has been reached or passed, its hash is ${blockHash}`);
// })();

module.exports = {
    getEOSBlockNumber,
    waitForEOSBlock
}