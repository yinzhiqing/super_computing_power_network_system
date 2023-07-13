const logger = require("./logger");
const { stdin, stdout } = require('process');


async function test() {
    logger.debug("test start");
    //let u256 = web3.eth.abi.encodeParameter("uint256", "zdj7WkQzA5BVAsk1zGHHpBTUjspTkNUBPpVutYEKTePdLj6CW");
    let u256 = web3.eth.abi.encodeParameter("uint256", "0x0000000000e7f91f6bd26e4c0703d9b2685157867ad81a5916333e97f8c2c476");
    logger.debug(u256);
    logger.debug("test end");
}

async function args() {
}

async function stdins() {
}

async function run() {
    logger.debug("start working...", "init_main");
    await test();
    await args();
    await stdins();
}

run()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
