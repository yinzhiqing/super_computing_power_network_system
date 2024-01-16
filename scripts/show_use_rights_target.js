const utils     = require("./utils");
const logger    = require("./logger");
const sur       = require("./use_rights_base.js");
const mb        = require("./market_base.js");
const { tco }   = require("./cache_opts.js");

async function run() {
    logger.debug("start working...", "show_tokens");
    let rights = await sur.datas_from_use_right_id(tco.fixed_use_right_id);
    let cvm    = await sur.datas_from_comp_vm_id(rights.row.cvmId);
    let revenue_info = await mb.load_revenue_info_by_slot(rights.row.cvmId);
    logger.form("使用权通证基本信息", rights.form, cvm.form, revenue_info.form);
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
