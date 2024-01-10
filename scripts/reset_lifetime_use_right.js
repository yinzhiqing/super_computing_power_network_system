const utils     = require("./utils");
const logger    = require("./logger");
const { tco }   = require("./cache_opts.js");
const { 
    users , 
    use_right 
    }        = require("./datas/env.config.js");
const urb       = require("./use_rights_base.js");

async function run() {
    let user        = users.manager; 
    let signer      = user.signer; 
    let use_right_id = tco.fixed_use_right_id;

    let infos       = await urb.reset_lifetime_use_right(signer, use_right_id, use_right.renewal_times);
    logger.table(infos);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });