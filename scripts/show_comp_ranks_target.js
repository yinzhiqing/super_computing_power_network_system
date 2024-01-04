
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const crb       = require("./comp_ranks_base.js");
async function works(use_right_id) {
    await crb.show_ranks_from_use_right_id(use_right_id);
}
async function run() {
    let use_right_id = "0x749a89a0dfc14119dda422c9f831dbe1454402694d7f52886c1bcde2aa94626e";
    let cobj     = await utils.contract("SCPNSUseRightToken");
    let amounts = await cobj.totalSupply();
    let list = [];
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
    //logger.table(list);
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

