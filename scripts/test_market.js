const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle  = require('./merkle');
const { users }       = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

/*
 * 此函数完成挑战
 *
 * 被挑战者从本地选择问题答案(叶子序号， 路径)并回答
 * 问题正确与否会在自动计算
 *
 */
async function work(buf) {

    let cobj = await utils.contract("SCPNSUseRightToken");
    let cobj2 = await utils.contract("SCPNSProofTask");
    logger.debug("address:   " + await cobj.address);
    logger.debug("pricision:   " + await cobj.pricision());
    logger.debug("pricision:   " + await cobj2.pricision());

}

async function run(times) {
    await work();
}

run(3)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
