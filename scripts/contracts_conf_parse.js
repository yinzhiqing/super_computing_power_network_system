// scripts/deploy_upgrade.js
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const bak_path  = prj.caches_contracts;
const tokens = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function show_msg(msg, title = "") {
    logger.show_msg(msg, title);
}

async function run() {
    logger.debug("start working...", "parseing contract config");
    logger.table(tokens, "source");
    for(var key in tokens) {
        if (tokens[key].fixed) continue;
        tokens[key].params = utils.contract_arguments_parse(tokens, tokens[key].params);
    }
    logger.table(tokens, "parsed.");
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
