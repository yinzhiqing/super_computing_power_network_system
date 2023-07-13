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

function is_target_name(token_name) {
    let target_token_name = "";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

async function show_accounts() {
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);
}

async function conv_type_id(type_id) {
    return web3.utils.soliditySha3(utils.str_to_web3uint256(type_id));
}
async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);
    logger.info(address + " check role(" + role + ") state: " + has);

    return has;
}

async function balance_of(client, owner) {
    let count = await client.balanceOf(owner);
    logger.debug(count);
    return count;
}

async function mint(client, signer, receiver, token_id, type_id) {
    logger.debug("mint from " + await signer.getAddress() + " to " + receiver + " with token_id = " + token_id);
    return await client.connect(signer).mint(receiver, token_id, type_id);
}

async function new_token_id() {
    var myDate = new Date();
    return web3.utils.soliditySha3(myDate.toLocaleTimeString());
}
async function run() {
    logger.debug("start working...", "mint");
    for (var token_name in tokens) {
        if (!is_target_name(token_name)) continue;

        logger.debug("#contract name: " + token_name);
        token = tokens[token_name];
        let cobj = await get_contract(token.name, token.address);
        logger.debug("nft address: " + token.address);

        const accounts = await web3.eth.getAccounts();
        let role = "MINTER_ROLE";
        let signer = ethers.provider.getSigner(0); 
        let minter = await signer.getAddress(); 
        let receiver = accounts[2];
        logger.debug("minter = " + minter);

        let has_miter = await has_role(cobj, minter, role);
        if (has_miter != true) {
            logger.error(personal + " no minter role." );
            return;
        } 

        let token_id= await new_token_id();
        logger.debug("token_id= " + token_id);


        let utid = utils.str_to_web3uint256(token_id);
        logger.debug("token_id(uint256) = " + utid);

        let type_data = "0x01";
        let type_id = await conv_type_id(type_data);
        logger.debug("type_id(uint256) = " + type_id);
        /*
    let existed = await cobj.typeIsExists(type_id);
    if (!existed) {
        logger.info("typeid " + type_id + "does not exists.");
        return;
    }

    let locked = await cobj.typeIsLocked(type_id);
    if (locked) {
        logger.info("typeid " + type_id + " already locked.");
        return;
    }
    */
        await balance_of(cobj, receiver);
        let tx = await mint(cobj, signer, receiver, token_id, type_id);
        logger.debug(tx);
        await balance_of(cobj, receiver);
    }
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
