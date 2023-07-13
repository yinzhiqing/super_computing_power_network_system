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

async function has_role(cobj, address, role) {
    let brole= await cobj.DEFAULT_ADMIN_ROLE();
    let has = await cobj.hasRole(brole, address);
    logger.info(address + " check role(" + role + ") state: " + has);

    return has;
}

async function lock(client, signer, type_id) {
    return await client.connect(signer).typeLock(type_id);
}

async function unlock(client, signer, type_id) {
    return await client.connect(signer).typeUnlock(type_id);
}

async function conv_type_id(type_id) {
    return web3.utils.soliditySha3(utils.str_to_web3uint256(type_id));
}

function is_target_name(token_name) {
    let target_token_name = "";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}
async function run() {
    logger.debug("start working...", "change_type_state");
    
    for (var token_name in tokens) {
        if (!is_target_name(token_name)) continue;

        logger.debug("#contract name: " + token_name);
        token = tokens[token_name];
        let cobj = await get_contract(token.name, token.address);
        logger.debug("nft address: " + token.address);
        const accounts = await web3.eth.getAccounts();
        let role = 0x00; //"DEFAULT_ADMIN_ROLE";
        let signer = ethers.provider.getSigner(0); 
        let signer_address = await signer.getAddress(); 

        let has_miter = await has_role(cobj, signer_address, role);
        if (has_miter != true) {
            logger.error(signer_address + " no admin role." );
            return;
        } 

        let type_data = "0x002";
        let type_id = await conv_type_id(type_data);
        logger.debug("type_id(uint256) = " + type_id);

        let locked = await cobj.typeIsLocked(type_id);
        if (locked) {
            let tx = await unlock(cobj, signer, type_id);
            logger.debug(tx);
        } else {
            let tx = await lock(cobj, signer, type_id);
            logger.debug(tx);
        }
    }

}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });


