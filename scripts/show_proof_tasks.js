const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const spt       = require("./show_proof_tasks_base.js");
const {proof_task}          = require("./datas/env.config.js");


async function run() {
    logger.debug("start working...", "show_tokens");
    await spt.works(proof_task.filter_count);
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

