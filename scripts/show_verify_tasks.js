const utils     = require("./utils");
const logger    = require("./logger");
const pvb       = require("./proof_verify_base.js");
const {verify_task}          = require("./datas/env.config.js");


async function run() {
        await pvb.show_verify_tasks(verify_task.filter_count);
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

