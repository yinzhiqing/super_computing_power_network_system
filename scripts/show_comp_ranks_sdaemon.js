const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const crb       = require("./comp_ranks_base.js");

async function run(times) {
    await utils.scheduleJob(times, crb.comp_ranks, null, true);
}

run(4)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

