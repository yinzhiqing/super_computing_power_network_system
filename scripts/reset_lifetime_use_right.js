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
    let use_right_id = tco.fixed_use_right_id;

    let infos       = await urb.reset_lifetime_use_right(user, use_right_id, use_right.resetlife_times);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
