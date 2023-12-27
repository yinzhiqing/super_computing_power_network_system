
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function show_tokens() {
    let cobj      = await utils.contract("SCPNSProofParameter");
    let type_unit = await utils.contract("SCPNSTypeUnit");
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
        row["name"] = utils.w3bytes32_to_str(await cobj.nameOf(row["tokenId"]));
        let verify_sample = Number(await cobj.sampleOf(row["tokenId"]));

        let parameter = utils.w3str_to_str(await cobj.parameterOf(row["tokenId"]));
        let datas = utils.w3str_to_str(await cobj.datasOf(row["tokenId"]));
        logger.debug("info: tokenId: " + row["tokenId"] + " name: " + row["name"] +  ")");
        logger.debug(">> parameter: " + parameter);
        logger.debug(">> datas: " + datas);
        parameter = JSON.parse(parameter);


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
                    "算力类型": type_unit_name,
                    "证明时间范围(秒)": utils.w3uint256_to_number(range[0]) + "~" + utils.w3uint256_to_number(range[1]),
                    "生成Merkle树叶子数": parameter["leaf_count"],
                    "生成Merkle树叶子深度": parameter["leaf_deep"],
                    "挑战次数": parameter["sample"],
                })

            }
        }

        use["参数名称"] = row["name"];
        use["算力类型"] = type_units.toString();
        uses.push(use);
        logger.debug(">> used: " + type_units.toString());

        list.push(row);

    } 
    logger.table(list, "证明参数列表");
    logger.table(uses, "算力类型使用证明参数列表");
    logger.table(rgs, "算力类型证明参数信息");
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

