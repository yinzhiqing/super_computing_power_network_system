const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { users, use_types }       = require("./datas/env.config.js");
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
    return web3.utils.sha3(pre + date.getTime().toString());
}

async function run() {
    logger.debug("start working...", "mint");

    let computility_unit = await utils.contract("SCPNSComputilityUnit");
    let computility_vm   = await utils.contract("SCPNSComputilityVM");

    let role   = "MINTER_ROLE";
    let signer = users.seller.signer; 
    let to = await signer.getAddress();

    let has_miter = await has_role(computility_vm, to, role);
    if (has_miter != true) {
        logger.error(to + " no minter role." );
        return;
    } 

    let computility_unit_count = await computility_unit.totalSupply();

    let deadline = Math.floor(((new Date()).getTime())/ 1000) + 5 * 365 * 24 * 60 * 60;

    let rows = [];

    for (var i = 0; i < computility_unit_count; i++) {
        let computility_unit_id = utils.w3uint256_to_hex(await computility_unit.tokenByIndex(i));
        let count = 1;

        let leaveCount = await computility_unit.leaveCountOf(computility_unit_id);
        if (leaveCount < count) {
            logger.debug("resources(" + computility_unit_id +")  cannot meet demand in SCPNSComputilityUnit");
            continue;
        }

        let token_id = await new_token_id(computility_unit_id);
        let datas = utils.json_to_w3str({data: "test"});
        logger.debug("new token: " + token_id + " deadline: " + deadline);

        let tx = await computility_vm.connect(signer).mint(to, token_id,  deadline, 
            [computility_unit_id], [count], datas);

        rows.push({
            to: to,
            token_id: token_id,
            typeUnitCount: count,
            leaveCount: leaveCount - count,
        })
    }
    logger.table(rows, "new tokens");
}

run(use_types)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
