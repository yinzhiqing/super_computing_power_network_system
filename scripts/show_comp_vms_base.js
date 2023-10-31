const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function works() {
    let cobj     = await utils.contract("SCPNSComputilityVM");
    let compUnit = await utils.contract("SCPNSComputilityUnit");
    let typeUnit = await utils.contract("SCPNSTypeUnit");
    logger.warning("算力信息");

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

module.exports = {
    works
}
