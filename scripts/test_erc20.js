const utils     = require("./utils");
const logger    = require("./logger");
const { users } = require("./datas/env.config.js");
const { uco }   = require("./cache_opts.js");
const {ethers}  = require("hardhat");
const { contracts_load } = require("./contracts.js");

async function works() {
    logger.info("账户金额");

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let erc20_token      = contracts.ERC20Token;
    logger.debug("vnet token address: " + erc20_token.address);
    let value   = await erc20_token.balanceOf("0x6cdca74470a656812d2542cfe7e476245277e8b1");
    logger.info("value: " + value);
    let decimals   = await erc20_token.decimals_();
    logger.info("decimals: " + decimals);

}

async function run(times) {
    let buf = {};
    //await utils.scheduleJob(times, works, buf, true);
    await works();
}
run(3)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
