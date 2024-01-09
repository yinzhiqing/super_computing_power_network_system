const utils     = require("./utils");
const logger    = require("./logger");
const {users}   = require("./datas/env.config.js");
const pvb       = require("./proof_verify_base.js");

async function run() {
    let user         = users.prover;
    let use_right_id = tco.fixed_use_right_id;

    pvb.proof(user, buf, use_right_id);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
