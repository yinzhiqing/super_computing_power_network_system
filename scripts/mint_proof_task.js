const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const {users}            = require("./datas/env.config.js");

const mpb       = require("./mint_proof_base.js");

async function run() {
    await mpb.works(users.buyer, users.prover);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
