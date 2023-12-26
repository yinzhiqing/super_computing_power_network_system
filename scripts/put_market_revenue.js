
const fs        = require('fs');
const utils     = require("./utils");
const logger    = require("./logger");
const gs_abi    = require("./datas/abis/GPUStore.json");
const { users }          = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");
const mb                 = require("./market_base.js");

async function run() {
    logger.debug("start working...", "put mark");
    let signer = users.seller.signer;
    let owner = await signer.getAddress();
    // 从配置文件中读取使用权通证(一个算力节点对应一个使用权通证)
    let token_id = utils.w3uint256_to_hex(await mb.select_revenue_id(owner));
    await mb.put_revenue(signer, token_id);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
