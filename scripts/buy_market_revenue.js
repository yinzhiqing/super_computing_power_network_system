const fs        = require('fs');
const utils     = require("./utils");
const logger    = require("./logger");
const { users }       = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");
const mb       = require("./market_base.js");

async function run() {
    let contracts        = await contracts_load();
    let gpu_store        = contracts.GPUStore;
    let saleIds = await gpu_store.getRevenueTokenForSaleIds();
    for (let i in saleIds) {
        let token_id = utils.w3uint256_to_hex(saleIds[i]);
        let sale_info = await gpu_store._revenueTokenStore(saleIds[i]);

        //get revenue sale is empty
        if (utils.w3uint256_to_hex(saleIds[i]) != utils.w3uint256_to_hex(sale_info[0])) {
            logger.debug("not found revenue in _revenueTokenStore, check contract.");
            logger.debug("target saleId: " + saleIds[i]);
            logger.debug("result saleId: " + sale_info[0]);
            continue;
        }
        await mb.buy_revenue(users.buyer.signer, token_id);
        break;
    }
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
