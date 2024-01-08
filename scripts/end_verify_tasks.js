
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const {users}   = require("./datas/env.config.js");
const pvb       = require("./proof_verify_base.js");

/*
 * 此函数完成挑战
 *
 * 被挑战者从本地选择问题答案(叶子序号， 路径)并回答
 * 问题正确与否会在自动计算
 *
 */
async function run() {
    logger.debug("start working...", "end_verify_tasks");

    let buf = {};
    let user = users.prover;
    await pvb.verify(user, buf)
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
