const fs        = require('fs');
const utils     = require("./utils");
const logger    = require("./logger");
const { users }       = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");
const mb       = require("./market_base.js");

async function run() {
    let contracts        = await contracts_load();
    let gpu_store        = contracts.GPUStore;
    let saleIds = await gpu_store.getGPUTokenForSaleIds();
    for (let i in saleIds) {
        let use_right_id = utils.w3uint256_to_hex(saleIds[i]);
        await mb.buy_use(users.buyer.signer, use_right_id);
        break;
    }
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
