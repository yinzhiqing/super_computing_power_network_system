const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const { users }             = require("./datas/env.config.js");
const { contracts_load }    = require("./contracts.js");
const datas_units           = require("./datas/units.config.js");
const revenue_values        = datas_units.units.revenue_values;
const default_revenue_value = datas_units.units.default_revenue_values;
const {ethers, upgrades}    = require("hardhat");

async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);

    return has;
}

async function create_token_id(data) {
    return web3.utils.sha3(data.toString());
}

async function run() {
    logger.debug("start working...", "mint type_revenue");

    let contracts = await contracts_load();
    let type_revenue = contracts.SCPNSTypeRevenue;

    let role   = "MINTER_ROLE";
    let signer = users.manager.signer; 
    let minter = await signer.getAddress(); 

    let has_miter = await has_role(type_revenue, minter, role);
    if (has_miter != true) {
        logger.error(minter + " no minter role." );
        return;
    } 

    let rows = [];
    let token_ids = [];

    logger.debug(revenue_values);
    for (var key in revenue_values) {
        let value = revenue_values[key];
        let token_id = await create_token_id(key);
        let token_name = key;

        token_ids.push(token_id);

        let isExists = await type_revenue.exists(token_id); 
        if (isExists == true) {
            logger.debug("token(id = " + token_id +" name =" + token_name + ") is exists, key=" + key);
            continue;
        }

        token_name = utils.str_to_w3bytes32(token_name);
        let datas = utils.json_to_w3str({data: key});
        logger.info("new token: " + token_id);

        logger.log(value);
        let tx = await type_revenue.connect(signer).mint(token_id, token_name, value, datas);

        rows.push({
            token_id: token_id,
            token_name: token_name,
            value: value,
        });
    }
    logger.table(rows);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
