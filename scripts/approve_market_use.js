const fs        = require('fs');
const utils     = require("./utils");
const logger    = require("./logger");
const gs_abi    = require("./datas/abis/GPUStore.json");
const { users } = require("./datas/env.config.js");
const urb       = require("./use_rights_base.js");
const mb        = require("./market_base.js");
const {tco}     = require("./cache_opts.js");

async function run() {
    logger.debug("start working...", "put mark");
    let user = users.buyer;
    let owner  = await user.signer.getAddress();

    // 从配置文件中读取使用权通证(一个算力节点对应一个使用权通证)
    let use_right_id = tco.fixed_use_right_id;
    let times = 11;
    use_right_id = use_right_id == null ? await urb.select_use_right_id(owner) : use_right_id;

    await mb.approve_use(user, use_right_id, times);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
