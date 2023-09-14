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
    let target_token_name = "SCPNSProofTask";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

async function show_tokens(token) {
    let cobj = await get_contract(token.name, token.address);
    logger.debug("token address: " + token.address);

    let name = await cobj.name();
    logger.debug("name: " + name);

    let amounts = await cobj.totalSupply();
    logger.debug("totalSupply: " + amounts);
    let list = [];
    for (let i = 0; i < amounts; i++) {
        let row = new Map();
        row["tokenId"] = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
        logger.info(">> tokenId; "     + row["tokenId"]);
        row["isInProof"] = await cobj.isInProofOf(row["tokenId"]);
        logger.info(">> isInProof "     + row["isInProof"]);

        let parameters = await cobj.parameterOf(row["tokenId"]);
        logger.debug(parameters);
        logger.info(">> dynamicData: "  + parameters[0]);

        let parameter = utils.w3str_to_str(parameters[1]);
        logger.info(">> parameter: "    + parameter);

        let datas = await cobj.taskDataOf(row["tokenId"]);
        logger.info(datas[1]);
        let taskDetail = datas[1];
        logger.info("tokenId:" + utils.w3uint256_to_str(taskDetail[0]));
        logger.info("start: "+ utils.w3uint256_to_str(taskDetail[1]));
        logger.info("end: "+ utils.w3uint256_to_str(taskDetail[2]));
        logger.info("merkleRoot: "+ taskDetail[3]);
        logger.info("state: "+ utils.w3uint256_to_str(taskDetail[3]));

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

