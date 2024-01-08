const utils     = require("./utils");
const logger    = require("./logger");
const {verify_task}          = require("./datas/env.config.js");
const pvb       = require("./proof_verify_base.js");


async function run(times) {
        logger.debug("start show verify tasks");
        await utils.scheduleJob(times, pvb.show_verify_tasks, verify_task.filter_count, true);
}
run(5)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

