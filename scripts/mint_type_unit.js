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
    let target_token_name = "SCPNSTypeUnit";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

async function show_accounts() {
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);
}

async function conv_type_id(id) {
    return web3.utils.soliditySha3(utils.str_to_web3uint256(id));
}
async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);
    logger.info(address + " check role(" + role + ") state: " + has);

    return has;
}

async function count_of(client) {
    let count = await client.countOf();
    logger.debug(count);
    return count;
}

async function mint(client, signer, token_id, name, unitAddr, unitId, datas) {
    logger.debug("mint from " + await signer.getAddress() + " to with token_id = " + token_id);
    return await client.connect(signer).mint(token_id, name, unitAddr, unitId, datas);
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
        logger.debug("minter = " + minter);

        let has_miter = await has_role(cobj, minter, role);
        if (has_miter != true) {
            logger.error(personal + " no minter role." );
            return;
        } 

        let token_id = await new_token_id();
        logger.debug("token_id= " + token_id);


        let name = utils.str_to_web3bytes32("GPU-A100");
        let unitAddr = '0x59b670e9fA9D0A427751Af201D676719a970857b';
        let unitId = '0x25c464a9250da72a7222a0ec0fdd108afc879949eec8d4fcef81e3ffe2afa698';
        let tx = await mint(cobj, signer, token_id, name, unitAddr, unitId, web3.utils.toHex("this is comptility datas"));
        logger.debug(tx);
        await count_of(cobj);
    }
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
