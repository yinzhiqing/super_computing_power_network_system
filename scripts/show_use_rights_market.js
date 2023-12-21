const fs        = require('fs');
const utils     = require("./utils");
const logger    = require("./logger");
const gs_abi    = require("./datas/abis/GPUStore.json");
const { users }       = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");
const mb       = require("./market_base.js");

async function run() {
    logger.debug("参与市场交易者使用权通证列表");
    await mb.use_right_ids_of(users.seller);
    await mb.use_right_ids_of(users.buyer);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
