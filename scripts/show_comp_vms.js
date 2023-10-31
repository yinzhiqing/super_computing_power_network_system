
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const scv       = require("./show_comp_vms_base.js");

async function run() {
    logger.debug("start working...", "show_tokens");
    await scv.works();
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

