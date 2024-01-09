
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const crb       = require("./comp_ranks_base.js");
const {tco}     = require("./cache_opts.js");

async function works(use_right_id) {
    await crb.show_ranks_from_use_right_id(use_right_id);
}
async function run() {
    let use_right_id = tco.fixed_use_right_id;
    let cobj     = await utils.contract("SCPNSUseRightToken");
    let amounts = await cobj.totalSupply();
    let list = [];

    logger.debug("fixed use_right_id: " + use_right_id);
    if (use_right_id) {
        await works(use_right_id);
    } else {
        for (let i = 0; i < amounts; i++) {
            use_right_id = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
            let owner    = await cobj.ownerOf(use_right_id);
            let cvmid    = utils.w3uint256_to_hex(await cobj.computilityVMIdOf(use_right_id));
            list.push({
                "使用权通证": use_right_id,
                "拥有者": owner,
                "资源ID": cvmid
            })
            await works(use_right_id);
        }
    }
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

