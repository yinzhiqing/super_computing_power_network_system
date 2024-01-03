const utils     = require("./utils");
const logger    = require("./logger");
const sur       = require("./use_rights_base.js");
const {use_right}          = require("./datas/env.config.js");

async function run() {
    logger.debug("start working...", "show_tokens");
    await sur.works(use_right.filter_count);
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
