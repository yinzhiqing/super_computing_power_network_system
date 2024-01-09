const utils     = require("./utils");
const logger    = require("./logger");
const { tco }   = require("./cache_opts.js");
const {users}   = require("./datas/env.config.js");
const pvb       = require("./proof_verify_base.js");

async function run() {
    let use_right_id = tco.fixed_use_right_id;
    await pvb.mint_proof(users.buyer, users.prover, use_right_id);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
