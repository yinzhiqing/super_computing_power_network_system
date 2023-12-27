const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const svt       = require("./show_verify_tasks_base.js");
const {verify_task}          = require("./datas/env.config.js");


async function run() {
        logger.debug("show verify tasks");
        await svt.works(verify_task.filter_count);
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

