
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { users }       = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

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
    logger.debug("start working...", "mint");
    let computility_unit = await utils.contract("SCPNSComputilityUnit");
    let type_unit        = await utils.contract("SCPNSTypeUnit");

    let role   = "MINTER_ROLE";
    let signer = users.manager.signer; 
    let minter = await signer.getAddress(); 
    let to     = await signer.getAddress();

    let has_miter = await has_role(computility_unit, to, role);
    if (has_miter != true) {
        logger.error(to + " no minter role." );
        return;
    } 

    let type_unit_count = await type_unit.totalSupply();

    let rows = [];
    for (var i = 0; i < type_unit_count; i++) {
        let type_unit_id = await type_unit.tokenByIndex(i);
        let type_unit_name = utils.w3bytes32_to_str(await type_unit.nameOf(type_unit_id));
        let token_id = await new_token_id(type_unit_name);
        let count = 1;

        if (types.includes(type_unit_name)) {
            let datas = utils.json_to_w3str({data: type_unit_name});
            logger.debug("new token: " + token_id);

            let tx = await computility_unit.connect(signer).mint(to, token_id,  type_unit_id, count, datas);

            rows.push({
                to: to,
                token_id: token_id,
                type_name: type_unit_name,
                type_unit_id: utils.w3uint256_to_hex(type_unit_id),
                type_unit_count: utils.w3uint256_to_str(count),
            })
        }
    }
    logger.table(rows, "new tokens");
}

run(["CPU", "GTX_1050"])
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
