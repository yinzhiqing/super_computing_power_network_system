const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const spt       = require("./show_proof_tasks_base.js");

async function run(times) {
    logger.debug("start show proof tasks");
    await utils.scheduleJob(times, spt.works, null, true);
}

run(5)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

