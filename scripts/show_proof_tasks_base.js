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
    let cobj = await utils.contract("SCPNSProofTask");
    logger.warning("算力证明任务信息");

    let name = await cobj.name();
    logger.debug("name: " + name);

    let amounts = await cobj.totalSupply();
    logger.debug("totalSupply: " + amounts);
    let list = [];
    for (let i = 0; i < amounts; i++) {
        let row = new Map();
        row["tokenId"] = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
        logger.debug(">> tokenId; "     + row["tokenId"]);
        row["useRightId"] = utils.w3uint256_to_hex(await cobj.useRightIdOf(row["tokenId"]));
        logger.debug(">> useRightId; "     + row["useRightId"]);
        row["isInProof"] = await cobj.isInProofOf(row["tokenId"]);
        logger.debug(">> isInProof "     + row["isInProof"]);

        let parameters = await cobj.parameterOf(row["tokenId"]);
        logger.debug(parameters);
        logger.debug(">> dynamicData: "  + parameters[0]);

        let parameter = utils.w3str_to_str(parameters[1]);
        logger.debug(">> parameter: "    + parameter);

        let datas = await cobj.taskDataOf(row["tokenId"]);
        row["owner"] = await cobj.ownerOf(row["tokenId"]);
        let taskDetail = datas[1];
        logger.debug("tokenId:" + utils.w3uint256_to_str(taskDetail[0]));
        logger.debug("start: "+ utils.w3uint256_to_str(taskDetail[1]));
        logger.debug("end: "+ utils.w3uint256_to_str(taskDetail[2]));
        logger.debug("merkleRoot: "+ taskDetail[3]);
        logger.debug("state: "+ utils.w3uint256_to_str(taskDetail[3]));
        logger.debug("owner: "+ row["owner"]);
        row["owner"] = row["owner"].substr(0, 6);

        list.push(row);

    } 
    logger.table(list);
}

module.exports = {
    works
}
