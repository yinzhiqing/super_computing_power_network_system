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

async function show_accounts() {
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);
}

async function grant_role(cobj, address, role) {
    logger.debug("start working...", "grant_role");
    let has = await has_role(cobj, address, role);
    if (has != true) {
        logger.info("grant role :" +  role + " for " + address);
        let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
        await cobj.grantRole(brole, address);
        await has_role(cobj, address, role);
    } else {
        logger.info(address + " had role: " +  role);

    }
}

async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);
    logger.info(address + " check role(" + role + ") state: " + has);

    return has;
}

async function grant_minter(cobj, address) {
    logger.debug("start grant minter...", "role opt");
    let role = "MINTER_ROLE";

    let has = await has_role(cobj, address, role);
    if (has) {
        logger.debug("had minter role");
    } else {
        await grant_role(cobj, address, role);
    }
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

        let personal_index = 1;
        let personal = accounts[personal_index];
        let platform = accounts[2];

        let addresses = [
            personal,
            platform,
            "0xcDed1ab3DA25eBB46e7bbb32CfeFbdace71f9E50"
        ]

        for (let i = 0; i < addresses.length; i++) {
            await grant_minter(cobj, addresses[i]);
        }
    }
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
