
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

function is_target_name(token_name) {
    let target_token_name = "SCPNSProofParameter";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

async function show_tokens(token) {
    let cobj      = await utils.contract("SCPNSProofParameter");
    let type_unit = await utils.contract("SCPNSTypeUnit");
    logger.debug("token address: " + token.address);

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
        row["name"] = utils.w3bytes32_to_str(await cobj.nameOf(row["tokenId"]));
        row["verify_sample"] = Number(await cobj.sampleOf(row["tokenId"]));

        let parameter = utils.w3str_to_str(await cobj.parameterOf(row["tokenId"]));
        let datas = utils.w3str_to_str(await cobj.datasOf(row["tokenId"]));
        logger.info("info: tokenId: " + row["tokenId"] + " name: " + row["name"] +  ")");
        logger.info(">> parameter: " + parameter);
        logger.info(">> datas: " + datas);

        let type_units_ids = await cobj.typeUnitIds();
        let type_units = [];
        for(var j = 0; j < type_units_ids.length; j++) {
            let type_unit_id = type_units_ids[j];
            let para_id = utils.w3uint256_to_hex(await cobj.parameterIdOfTypeUnitId(type_unit_id));
            // use this parameter
            if (para_id == row["tokenId"]) {
                // get type unit name
                let type_unit_name = utils.w3bytes32_to_str(await type_unit.nameOf(type_unit_id));
                type_units.push(type_unit_name);

                //get range
                let range = await cobj.computilityRangeOfTypeUnit(para_id, type_unit_id);
                rgs.push({
                    name: row["name"],
                    typeUnitName: type_unit_name,
                    min: utils.w3uint256_to_number(range[0]),
                    max: utils.w3uint256_to_number(range[1]),
                })

            }
        }

        use["name"] = row["name"];
        use["typeUnitName"] = type_units.toString();
        uses.push(use);
        logger.info(">> used: " + type_units.toString());

        list.push(row);

    } 
    logger.table(list);
    logger.table(uses);
    logger.table(rgs);
}

async function run() {
    logger.debug("start working...", "show_tokens");
    for (var token_name in tokens) {
        if (!is_target_name(token_name)) continue;

        logger.debug("#contract name: " + token_name);
        token = tokens[token_name];
        await show_tokens(token);
    }
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

