
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const {users}   = require("./datas/env.config.js");
const pvb       = require("./proof_verify_base.js");
const {tco}     = require("./cache_opts.js");

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
    let use_right_id = tco.fixed_use_right_id;
    await pvb.verify(user, buf, use_right_id);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
