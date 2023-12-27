const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const spt       = require("./show_proof_tasks_base.js");
const {proof_task}          = require("./datas/env.config.js");

async function run(times) {
    logger.debug("start show proof tasks");
    await utils.scheduleJob(times, spt.works, proof_task.filter_count, true);
}

run(5)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

