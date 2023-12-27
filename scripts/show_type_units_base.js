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
    let cobj = await utils.contract("SCPNSTypeUnit");
    logger.warning("算力类型信息");

    let name = await cobj.name();
    logger.debug("name: " + name);

    let amounts = await cobj.totalSupply();
    logger.debug("totalSupply: " + amounts.toString());
    let list = [];
    for (let i = 0; i < amounts; i++) {
        let row = new Map();
        row["tokenId"] = web3.utils.toHex(await cobj.tokenByIndex(i));
        row["资源ID"] = utils.w3uint256_to_hex(await cobj.unitIdOf(row["tokenId"]));
        row["型号"]   = utils.w3bytes32_to_str(await cobj.nameOf(row["tokenId"]));
        row["类型"] = await cobj.unitTypeOf(row["tokenId"]);
        let datas = utils.w3str_to_str(await cobj.datasOf(row["tokenId"]));

        logger.debug("tokenId: " + row["tokenId"], "token info");
        logger.debug("name: " + row["name"]);

        list.push(row);

    } 
    logger.table(list);
}

module.exports = {
    works
}
