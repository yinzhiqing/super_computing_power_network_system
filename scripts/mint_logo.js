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
    let has = await cobj.hasRole(role, address);
    logger.info(address + " check role(" + role + ") state: " + has);

    return has;
}

async function balance_of(client, owner) {
    let count = await client.balanceOf(owner);
    logger.debug(count);
    return count;
}

async function mint(client, signer, receiver, token_id, data) {
    logger.debug("mint from " + await signer.getAddress() + " to " + receiver + " with token_id = " + token_id);
    return await client.connect(signer).mint(receiver, token_id, data);
}

async function new_token_id() {
    var myDate = new Date();
    return web3.utils.soliditySha3(myDate.toLocaleTimeString());
}
async function run() {
    logger.debug("start working...", "mint");
    token = tokens["SingleLogoToken"];

    let cobj = await get_contract(token.name, token.address);
    logger.debug("nft address: " + token.address);

    const accounts = await web3.eth.getAccounts();
    let role = await cobj.MINTER_ROLE();
    let signer = ethers.provider.getSigner(0); 
    let minter = await signer.getAddress(); 
    let receiver = accounts[2];
    logger.debug("minter = " + minter);

    let has_miter = await has_role(cobj, minter, role);
    if (has_miter != true) {
        logger.error(minter + " no minter role." );
        return;
    } 

    let token_id= await new_token_id();
    logger.debug("token_id= " + token_id);


    let utid = utils.str_to_web3uint256(token_id);
    logger.debug("token_id(uint256) = " + utid);

    time_stamp = new Date();
    tdata = time_stamp.getTime().toString();
    logger.debug("tdata(string) = " + tdata);
    let data = web3.eth.abi.encodeParameter("string", tdata);
    logger.debug("data(string) = " + data);
    await balance_of(cobj, receiver);

    let tx = await mint(cobj, signer, receiver, token_id, data);
    logger.debug(tx);
    await balance_of(cobj, receiver);
    
}

function sleep(time){
 return new Promise((resolve) => setTimeout(resolve, time));
}

run()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1)
    });
