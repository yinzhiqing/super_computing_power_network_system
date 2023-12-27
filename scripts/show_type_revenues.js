const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { contracts_load } = require("./contracts.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function show_tokens(title = "算力类型权益值") {
    logger.info(title);
    let contracts   = await contracts_load();
    let cobj        = contracts.SCPNSTypeRevenue;
    let type_unit   = await utils.contract("SCPNSTypeUnit");
    logger.debug("token address: " + cobj.address);

    let name = await cobj.name();
    logger.debug("name: " + name);

    let amounts = await cobj.totalSupply();
    logger.debug("totalSupply: " + amounts);
    let list = [];
    let uses = [];
    let rgs   = [];
    for (let i = 0; i < amounts; i++) {
        let row = new Map();
        let use = new Map();
        row["tokenId"] = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
        row["revenueName"] = utils.w3bytes32_to_str(await cobj.nameOf(row["tokenId"]));

        let value = await cobj.rvalueOf(row["tokenId"]);
        let datas = await cobj.datasOf(row["tokenId"]);
        row["value"] = Number(value);
        logger.debug("info: tokenId: " + row["tokenId"] + " name: " + row["revenueName"] +  ")");
        logger.debug(">> value: " + value);
        logger.debug(">> datas: " + datas);

        let type_units_ids = await cobj.typeUnitIds();
        let type_units = [];
        for(var j = 0; j < type_units_ids.length; j++) {
            let type_unit_id = type_units_ids[j];
            let token_id = utils.w3uint256_to_hex(await cobj.tokenIdOfTypeUnitId(type_unit_id));
            // use this parameter
            if (token_id == row["tokenId"]) {
                // get type unit name
                let type_unit_name = utils.w3bytes32_to_str(await type_unit.nameOf(type_unit_id));
                type_units.push(type_unit_name);
            }
        }

        row["typeUnitName"] = type_units.toString();
        use["typeUnitName"] = type_units.toString();
        use["revenueName"] = row["revenueName"];
        uses.push(use);
        logger.debug(">> used: " + type_units.toString());

        list.push(row);

    } 
    let show_list = [];
    for (let i in list) {
        show_list.push({
            "ID": list[i]["tokenId"],
            "算力资源类型": list[i]["typeUnitName"],
            "收益权值": list[i]["value"],
        })

    }
    logger.table(show_list);
    //logger.table(uses);
}

async function run() {
    logger.debug("start working...", "show_tokens");

    await show_tokens();
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

