

const utils     = require("./utils");
const logger    = require("./logger");
const {users}   = require("./datas/env.config.js");
const pvb       = require("./proof_verify_base.js");
const crb       = require("./comp_ranks_base.js");
const {tco}     = require("./cache_opts.js");

async function works(user, buf, use_right_id = null) {
    let token_id = await pvb.verify(user, buf, use_right_id);
    logger.debug("verify return token(" + token_id +")");
    if (token_id != null) {
        //显示排行信息
        await crb.show_ranks_from_use_right_id(token_id);
    }
}
async function run(times) {
    let buf = {};
    let use_right_id = tco.fixed_use_right_id;
    await utils.scheduleJob(times, works, [users.prover, buf, use_right_id], false);
}

run(8)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
