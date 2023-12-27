const utils     = require("./utils");
const logger    = require("./logger");
const mb       = require("./market_base.js");
const {store}          = require("./datas/env.config.js");

async function run() {
    await mb.revenue_orders(store.filter.orders.revenue);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
