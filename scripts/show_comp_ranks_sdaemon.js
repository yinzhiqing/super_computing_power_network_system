const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const scr       = require("./show_comp_ranks_base.js");

async function run(times) {
    await utils.scheduleJob(times, scr.works, null, true);
}

run(4)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

