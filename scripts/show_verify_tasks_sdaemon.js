const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const svt       = require("./show_verify_tasks_base.js");
const {verify_task}          = require("./datas/env.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function run(times) {
        logger.debug("start show verify tasks");
        await utils.scheduleJob(times, svt.works, verify_task.filter_count, true);
}
run(5)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

