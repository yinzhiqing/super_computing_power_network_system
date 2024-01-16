
const fs        = require('fs');
const utils     = require("./utils");
const logger    = require("./logger");
const gs_abi    = require("./datas/abis/GPUStore.json");
const { users } = require("./datas/env.config.js");
const mb        = require("./market_base.js");
const {tco}     = require("./cache_opts.js");
const { contracts_load } = require("./contracts.js");

async function run() {
    logger.debug("start working...", "put mark");
    let signer = users.manager.signer;
    let owner = await signer.getAddress();
    let use_right_id = tco.fixed_use_right_id;
    let token_id = utils.w3uint256_to_hex(await mb.select_revenue_id(owner, use_right_id));
    await mb.put_revenue(signer, token_id);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
