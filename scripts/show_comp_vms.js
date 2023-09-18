
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
    let target_token_name = "SCPNSComputilityVM";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

async function contract(name) {
    let token = tokens[name];
    return await get_contract(token.name, token.address);
}

async function show_tokens(token) {
    let cobj = await contract("SCPNSComputilityVM");
    let compUnit = await contract("SCPNSComputilityUnit");
    let typeUnit = await contract("SCPNSTypeUnit");
    logger.debug("token address: " + token.address);

    let name = await cobj.name();
    logger.debug("name: " + name);

    let amounts = await cobj.totalSupply();
    logger.debug("totalSupply: " + amounts);
    let list = [];
    for (let i = 0; i < amounts; i++) {
        let row = new Map();
        row["tokenId"] = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
        row["算力单元数量"] = utils.w3uint256_to_str(await cobj.computilityUnitCountOf(row["tokenId"]));
        let typeUnitId = await cobj.typeUnitIdOf(row["tokenId"])
        let typeUnitName  = utils.w3bytes32_to_str(await typeUnit.nameOf(typeUnitId));
        row["型号"] = typeUnitName;
        row["数量"] = utils.w3uint256_to_str(await cobj.typeUnitCountOf(row["tokenId"]));


        let datas = utils.w3str_to_str(await cobj.datasOf(row["tokenId"]));
        logger.debug("tokenId: " + row["tokenId"], "token info");
        logger.debug("datas: ");
        logger.debug(JSON.parse(datas));

        list.push(row);

    } 
    logger.table(list);
}

async function run() {
    logger.debug("start working...", "show_tokens");
    for (var token_name in tokens) {
        if (!is_target_name(token_name)) continue;

        logger.debug("#contract name: " + token_name);
        token = tokens[token_name];
        await show_tokens(token);
    }
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

