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

async function show_accounts() {
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);
}

async function balance_of(client, owner) {
    logger.debug("get balance_of " + owner);
    let count = await client.balanceOf(owner);
    logger.debug("balances: " + count);
    return count;
}

function is_target_name(token_name) {
    let target_token_name = "";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

async function run() {
    logger.debug("start working...", "account tokens");
    for (var token_name in tokens) {
        if (!is_target_name(token_name)) continue;

        logger.debug("#contract name: " + token_name);
        token = tokens[token_name];
        let cobj = await get_contract(token.name, token.address);
        logger.debug("nft address: " + token.address);

        const accounts = await web3.eth.getAccounts();
        let account = accounts[2];
        account = "0xDB10B29830D75A8157BaB7442d3047Dc200D007E"
        account = "0xcDed1ab3DA25eBB46e7bbb32CfeFbdace71f9E50"


        let name = await cobj.name();
        logger.debug("name: " + name);

        let amounts = await balance_of(cobj, account);
        logger.info(account + " has balance " + amounts);
        logger.debug("amounts: " + amounts);
        for (let i = 0; i < amounts; i++) {
            let tokenId = await cobj.tokenOfOwnerByIndex(account, i);
            logger.info("token id(" + (i + 1) + "): " + web3.utils.toHex(tokenId));
        } 
    }
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
