const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function get_contract(name, address) {
    return await utils.get_contract(name, address);
}

function is_target_name(token_name) {
    let target_token_name = "SCPNSComputilityRanking";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

async function contract(name) {
    let token = tokens[name];
    return await get_contract(token.name, token.address);
}

async function show_tokens() {
    let cobj            = await contract("SCPNSComputilityRanking");
    let proof_parameter = await contract("SCPNSProofParameter");
    let type_unit       = await contract("SCPNSTypeUnit");
    logger.debug("token address: " + cobj.address);

    let name = await cobj.name();
    logger.debug("name: " + name);

    logger.debug("pricision: " + await cobj.pricision());

    let parameters = await cobj.parameters();
    /**
     * [ parameterId : 
     *   {typeUnitId : 
     *     {scale => datas}
     *   }
     * ]
     */
    let list = {};
    for (let i = 0; i < parameters.length; i++) {
        logger.debug("parameter: " + utils.w3uint256_to_hex(parameters[i]));
        let parameter_name = utils.w3bytes32_to_str(await proof_parameter.nameOf(parameters[i]));
        let scales = await cobj.scalesOf(parameters[i]);
        let type_unit_ids = await cobj.typeUnitIdsOf(parameters[i]);
        let t = {};
        for (let l = 0; l < type_unit_ids.length; l++) {
            let range  = await proof_parameter.computilityRangeOfTypeUnit(parameters[i], type_unit_ids[i]);
            logger.debug(range);
            let min = range[0].toString();
            let max = range[1].toString();
            logger.table({"min(s)": min, "max(s)": max}, "parameter = " + parameter_name + " typeUnitName( " + utils.w3bytes32_to_str(await type_unit.nameOf(type_unit_ids[l])) + ")");

            let s = {}
            for (let j = 0; j < scales.length; j++) {
                logger.debug("scale: " + scales[j]);
                let datas = [];
                let count = await cobj.countOfHistory(parameters[i], scales[j], type_unit_ids[l]);
                logger.debug("count: " + count);
                for (var k = 0; k < count; k++) {
                    let xy = await cobj.excTimeHistoryByIndex(parameters[i], scales[j], type_unit_ids[l], k);
                    datas.push({
                        x: xy[0].toString(),
                        y: xy[1].toString(),
                    });
                    logger.debug(datas[datas.length -1]);
                }
                s[scales[j]] = datas;
                logger.table(datas, "parameter = " + parameter_name + "(" + scales[j] + ")" + " typeUnitName( " + utils.w3bytes32_to_str(await type_unit.nameOf(type_unit_ids[l])) + ")");
            }
            t[utils.w3uint256_to_hex(type_unit_ids[l])] = s;
        }
        list[utils.w3uint256_to_hex(parameters[i])] = t;
    } 
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

