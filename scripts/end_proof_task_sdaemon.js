const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle    = require('./merkle');
const {users}   = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");
const pvb       = require("./proof_verify_base.js");

async function run(times) {
    let buf = {};
    let user = users.prover;
    await utils.scheduleJob(times, pvb.proof, [user, buf], false, 30);
}

run(5)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
