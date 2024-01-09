const logger    = require("./logger");
const { users } = require("./datas/env.config.js");
const mb        = require("./market_base.js");
const {tco}     = require("./cache_opts.js");

async function run() {
    let use_right_id = tco.fixed_use_right_id == null ? await mb.select_use_right_id_from_market() : use_right_id;
    await mb.buy_use(users.buyer.signer, use_right_id);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
