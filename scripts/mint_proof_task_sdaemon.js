

const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const mpb       = require("./mint_proof_base.js");

async function run(times) {
    await utils.scheduleJob(times, mpb.works, null, false);
}

run(30)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

