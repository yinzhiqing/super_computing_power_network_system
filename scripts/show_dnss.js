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

async function show_dns(cobj){
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

    let cobj = await utils.contract("SCPNSDns");
    await show_dns(cobj);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });

