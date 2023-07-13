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

async function show_dns(cobj, name){
    count = await cobj.count();
    hosts = [];
    logger.info("hosts: " + count);
    for(var i = 0; i < count; i++) {
        host = await cobj.hostOf(i);
        hosts.push({"name": host[0], "address":host[1]});
    }
    logger.table(hosts);
}

async function run() {
    logger.debug("start working...", "notes");

    token = tokens["AssemblyDNS"];
    let cobj = await get_contract(token.name, token.address);

    const accounts = await web3.eth.getAccounts();
    let role = 0x00; //"DEFAULT_ADMIN_ROLE";
    let signer = ethers.provider.getSigner(0); 

    await show_dns(cobj, token.name);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });

