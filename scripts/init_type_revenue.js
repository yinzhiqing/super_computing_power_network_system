const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const units_cfg             = require("./datas/units.config.js");
const { users }             = require("./datas/env.config.js");
const { contracts_load }    = require("./contracts.js");
const {ethers, upgrades}    = require("hardhat");
const units                 = units_cfg.units;
const revenue_values        = units.default_revenue_value;
const default_revenue_value = units.default_revenue_value;

async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);

    return has;
}

async function show_def_para() {
    logger.info(def_values);
}

async function init_def_revenue_values(type_unit, type_revenue, gpu_list, signer) {
    logger.debug("init parameter...", "init revenue def values");

    // typeUnit list
    let rows = [];
    for(let key in default_revenue_value) {
        let row = {};
        row["type_unit_name"]   = key;
        row["revenue_name"]     = default_revenue_value[key];
        row["type_unit_id"]     = utils.w3uint256_to_hex(await type_unit.tokenIdOf(utils.str_to_w3bytes32(row["type_unit_name"])));
        row["gpu_id"]           = utils.w3uint256_to_hex(await type_unit.unitIdOf(row["type_unit_id"]));
        row["gpu_name"]         = utils.w3bytes32_to_str(await gpu_list.nameOf(row["gpu_id"]));

        let revenue_id          = utils.w3uint256_to_hex(await type_revenue.tokenIdOf(utils.str_to_w3bytes32(row["revenue_name"])));


        let exists = await type_unit.exists(row["type_unit_id"]);
        if (!exists) {
            logger.debug("type unit id(" + row["type_unit_id"].toString() + ") is nonexists.");
            continue;
        }

        logger.debug("start set");
        logger.debug(row);
        logger.debug("set default value(" + revenue_id. toString() + ") of type unit(" + row["type_unit_id"] + ").");

        rows.push({
            gpu_name: row["gpu_name"],
            typeUnitId: utils.w3uint256_to_hex(row["type_unit_id"]).substr(0, 6),
            tokenId: utils.w3uint256_to_hex(revenue_id).substr(0, 6),
            tokenName: row["revenue_name"],
        })

        await type_revenue.setDefaultTokenOf(row["type_unit_id"], revenue_id);
    }
    //logger.table(rows, "new set def_revenue_value");
}

async function run() {
    logger.debug("start working...", "init parameters");

    let type_revenue    = await utils.contract("SCPNSTypeRevenue");
    let type_unit       = await utils.contract("SCPNSTypeUnit");
    let gpu_list        = await utils.contract("SCPNSGpuList");

    let role   = "MINTER_ROLE";
    let signer = users.manager.signer; 
    let minter = await signer.getAddress(); 

    let has_miter = await has_role(type_revenue, minter, role);
    if (has_miter != true) {
        logger.error(minter + " no minter role." );
        return;
    } 

    await init_def_revenue_values(type_unit, type_revenue, gpu_list, signer);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
