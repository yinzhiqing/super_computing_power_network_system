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

async function has_role(client, address) {
    let role= await client.WRITER_ROLE();
    let has = await client.hasRole(role, address);
    logger.info(address + " check role(" + role + ") state: " + has);

    return has;
}

async function write(client, signer, msg){
    let has_miter = await has_role(client, await signer.getAddress());
    if (has_miter != true) {
        logger.error(signer_address + " no admin role." );
        return;
    } 

    block_number = await client.preBlockNumberOf(signer.getAddress());
    logger.info("pre_block_number: " + block_number);
    tx = await client.connect(signer).write(msg);
    logger.debug(tx);
}

async function run() {
    logger.debug("start working...", "notes");

    token = tokens["AssemblyNotes"];
    let cobj = await get_contract(token.name, token.address);

    const accounts = await web3.eth.getAccounts();
    let role = 0x00; //"DEFAULT_ADMIN_ROLE";
    let signer = ethers.provider.getSigner(0); 

    //write()
    timestamp = new Date();
    //await write(cobj, signer, "hello notes: " + timestamp.getTime().toString());
    data = web3.eth.abi.encodeParameter("string", "hello world");
    //data = web3.eth.abi.encodeParameter("string", web3.utils.toHex("hello world"));
    logger.info("data: " + data);
    await write(cobj, signer, data);
}


run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });

