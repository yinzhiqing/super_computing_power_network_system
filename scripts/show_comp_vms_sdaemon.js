const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const scv       = require("./show_comp_vms_base.js");

async function run(times) {
    logger.debug("show computility os");
    await utils.scheduleJob(times, scv.works);
}

run(5)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

