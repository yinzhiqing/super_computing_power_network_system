const fs        = require('fs');
const utils     = require("./utils");
const logger    = require("./logger");
const gs_abi    = require("./datas/abis/GPUStore.json");
const { users } = require("./datas/env.config.js");
const mb        = require("./market_base.js");
const urb       = require("./use_rights_base.js");

async function run() {
    logger.debug("start working...", "put mark");
    let signer = users.buyer.signer;
    let owner = await signer.getAddress();
    // 从配置文件中读取使用权通证(一个算力节点对应一个使用权通证)
    let use_right_id = await urb.select_use_right_id(owner);
    await mb.put_use(signer, use_right_id);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
