const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const stu       = require("./show_type_units_base.js");


async function run(times) {
        logger.debug("start show type unit");
        await utils.scheduleJob(times, stu.works);
}

run(5)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

