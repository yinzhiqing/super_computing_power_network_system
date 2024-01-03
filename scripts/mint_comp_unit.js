
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { users, use_types }       = require("./datas/env.config.js");
const { contracts_load }         = require("./contracts.js");
const urb                        = require("./use_rights_base.js");


async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);

    return has;
}

async function new_token_id(pre) {
    var date = new Date();
    return web3.utils.soliditySha3(pre + date.toLocaleTimeString());
}

async function run(types) {
    let user   = users.manager; 
    let signer = user.signer; 
    let to     = await signer.getAddress();
    logger.debug(types);

    let list = [];
    for(let i in types) {
        let token_id = await urb.new_token_id(types[i]);
        await urb.mint_comp_unit(user, to, token_id, 1, types[i]);
        list.push(token_id);
    }

    for(let i in list) {
        let token_id = list[i];
        await urb.wait_comp_unit_exists(token_id);
        await urb.show_comp_units(token_id);
    }
}

run(use_types)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
