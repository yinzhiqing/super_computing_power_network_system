
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

    let target_token_name = "SCPNSComputilityUnit";

async function show_tokens() {
    let compUnit = await utils.contract("SCPNSComputilityUnit");
    let typeUnit = await utils.contract("SCPNSTypeUnit");

    logger.debug("token address: " + compUnit.address);

    let name = await compUnit.name();
    logger.debug("name: " + name);

    let amounts = await compUnit.totalSupply();
    logger.debug("totalSupply: " + amounts);
    let list = [];
    for (let i = 0; i < amounts; i++) {
        let row = new Map();
        row["tokenId"] = utils.w3uint256_to_hex(await compUnit.tokenByIndex(i));

        typeUnitId = utils.w3uint256_to_hex(await compUnit.typeUnitIdOf(row["tokenId"]));
        row["类型ID"] = typeUnitId;
        row["型号"] = utils.w3bytes32_to_str(await typeUnit.nameOf(typeUnitId));
        row["类型"] = await typeUnit.unitTypeOf(typeUnitId);
        row["总数量"] = utils.w3uint256_to_str(await compUnit.typeUnitCountOf(row["tokenId"]));
        row["剩余数量"] = utils.w3uint256_to_str(await compUnit.leaveCountOf(row["tokenId"]));


        let datas = utils.w3str_to_str(await compUnit.datasOf(row["tokenId"]));
        logger.debug("tokenId: " + row["tokenId"], "token info");
        logger.debug("datas: ");
        logger.debug(JSON.parse(datas));

        list.push(row);

    } 
    logger.table(list);
}

async function run() {
    logger.debug("start working...", "show_tokens");
    await show_tokens();
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

