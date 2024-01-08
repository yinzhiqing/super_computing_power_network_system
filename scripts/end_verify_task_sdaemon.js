

const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle  = require('./merkle');
const {users}       = require("./datas/env.config.js");
const pvb           = require("./proof_verify_base.js");

async function run(times) {
    let buf = {};
    let use_right_id = null;
    await utils.scheduleJob(times, pvb.verify, [users.prover, buf, use_right_id], false);
}

run(8)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
