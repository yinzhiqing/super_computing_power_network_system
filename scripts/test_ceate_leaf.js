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

    let verify_task     = await utils.contract("SCPNSVerifyTask");

    let signer          = users.buyer.signer; 
    let signer_address  = await signer.getAddress();

    let dynamicData = "0x58c8e3399859d95303da28857cdddff61ad7dcfa7bb9bcbe04f5f01e14972140";
    let index     = 100;
    let leaf_count = 1024;
    let leaf_deep = 10;
    let useSha256 = true;
    let sample = 10;
    for(let i = 0; i < sample; i++) {
        let rand = await verify_task.connect(signer).randIndex(1000, sample, i);
        logger.debug("index: " + Number(rand) + " of " + i);
    }
}

async function run(times) {
    let buf = {};
    await utils.scheduleJob(times, work, buf, false/* clear */);
}

run(3)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
