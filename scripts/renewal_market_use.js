const utils     = require("./utils");
const logger    = require("./logger");
const { tco }   = require("./cache_opts.js");
const mb        = require("./market_base.js");
const { 
    users , 
    use_right 
    }        = require("./datas/env.config.js");

async function run() {
    let user        = users.buyer; 
    let use_right_id = tco.fixed_use_right_id;

    let infos       = await mb.renewal_use_right(user, use_right_id);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  })
