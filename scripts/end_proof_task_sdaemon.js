const utils     = require("./utils");
const logger    = require("./logger");
const {users}   = require("./datas/env.config.js");
const pvb       = require("./proof_verify_base.js");
const { tco }   = require("./cache_opts.js");

async function run(times) {
    let buf          = {};
    let user         = users.prover;
    let use_right_id = tco.fixed_use_right_id;
    await utils.scheduleJob(times, pvb.proof, [user, buf, use_right_id], false, 120);
}

run(5)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
