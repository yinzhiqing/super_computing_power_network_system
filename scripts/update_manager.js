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

const redis = require("redis");

async function get_contract(name, address) {
    return await utils.get_contract(name, address);
}

function is_target_name(token_name) {
    let target_token_name = "";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);
    logger.info(address + " check role(" + role + ") state: " + has);

    return has;
}

async function run() {
    logger.debug("start working...", "role opt");
    //await show_accounts();
    
    const accounts = await web3.eth.getAccounts();

    for (var token_name in tokens) {
        if (!is_target_name(token_name)) continue;

        logger.debug("#contract name: " + token_name);
        token = tokens[token_name];
        let cobj = await get_contract(token.name, token.address);
        logger.debug("nft address: " + token.address);

        let personal = accounts[4];
        let new_manager = "0xc9702898f44bD124712184DAeffbd2bf012e069B";
        let old_manager = await cobj.tokenManager();
        logger.info("manager is  " + old_manager);
        if (old_manager != new_manager) {
            logger.info("update manager to " + new_manager);
            await cobj.updateTokenManager(new_manager);
        }
    }
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
