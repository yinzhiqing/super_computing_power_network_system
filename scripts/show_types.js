// scripts/deploy_upgrade.js
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function get_contract(name, address) {
    return await utils.get_contract(name, address);
}

function is_target_name(token_name) {
    let target_token_name = "";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

async function conv_type_id(type_id) {
    return web3.utils.soliditySha3(utils.str_to_web3uint256(type_id));
}
async function show_types(token) {

    let list = [];
    let cobj = await get_contract(token.name, token.address);

    let tc = await cobj.countOfType();
    logger.debug(tc.toString());

    for(var i = 0; i < parseInt(tc); i++) {
        let t      = {};
        t["id"] = web3.utils.toHex(await cobj.typeByIndex(utils.str_to_web3uint256(i)));
        t["datas"] = await cobj.typeDatasOfType(t["id"]);
        list.push(t);
    }
    logger.table(list);

}

async function run() {
    logger.debug("start working...", "show_types");
    for (var token_name in tokens) {
        if (!is_target_name(token_name)) continue;

        logger.debug("#contract name: " + token_name);
        token = tokens[token_name];
        await show_types(token);
    }
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });


