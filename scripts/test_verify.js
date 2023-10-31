


const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle  = require('./merkle');

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

    let signer          = ethers.provider.getSigner(1); 
    let signer_address  = await signer.getAddress();

    let rows = [];

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
