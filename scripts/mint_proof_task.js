const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { tco }   = require("./cache_opts.js");
const {users}            = require("./datas/env.config.js");

const pvb       = require("./proof_verify_base");

async function run() {
    await pvb.mint_proof(users.buyer, users.prover);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
