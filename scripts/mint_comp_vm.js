const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { contracts_load }             = require("./contracts.js");
const { users, use_types, vm }       = require("./datas/env.config.js");
const urb                            = require("./use_rights_base.js");

async function run(types) {
    let deadline = Math.floor(((new Date()).getTime())/ 1000) + vm.deadline;
    let user   = users.manager;
    let signer = user.signer; 
    let to = await signer.getAddress();

    for( let i in types) {
        let type = types[i];
        let cuid = await urb.select_comp_unit_ids_of_owner(to, type, 1);
        //无可用算力单元，创建comp_unit
        if (cuid == null) {
            cuid = await urb.new_token_id(type);
            await urb.mint_comp_unit(user, to, cuid, 1, type);
            await urb.wait_comp_unit_exists(cuid);
        }

        let token_id = await urb.new_token_id(cuid);
        await urb.mint_comp_vm(user, to, token_id, cuid, 1, deadline);
        await urb.wait_comp_vm_exists(token_id);
        await urb.show_comp_vm(token_id);
    }
}
run(use_types)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
