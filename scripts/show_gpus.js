const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function show_tokens() {
    let cobj = await utils.contract("SCPNSGpuList");
    logger.debug("token address: " + cobj.address);

    let name = await cobj.name();
    logger.debug("name: " + name);

    let amounts = await cobj.totalSupply();
    logger.debug("totalSupply: " + amounts);
    let list = [];
    for (let i = 0; i < amounts; i++) {
        let row = new Map();
        row["tokenId"] = web3.utils.toHex(await cobj.tokenByIndex(i));
        row["name"]   = utils.w3bytes32_to_str(await cobj.nameOf(row["tokenId"]));
        let datas = utils.w3str_to_str(await cobj.datasOf(row["tokenId"]));

        logger.debug("tokenId: " + row["tokenId"], "token info");
        logger.debug("name: " + row["name"]);
        logger.debug("datas: ");
        var gpus = JSON.parse(datas);
        logger.debug(gpus);

        logger.table(gpus, "gpu("+ row["name"] +") info");

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

