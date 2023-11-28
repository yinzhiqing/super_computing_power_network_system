const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");
let cobj = null;
let proof_parameter = null;
let type_unit = null;
async function contracts() {
    if (cobj == null) {
        cobj = await utils.contract("SCPNSComputilityRanking");
    }

    if (proof_parameter == null) {
        proof_parameter = await utils.contract("SCPNSProofParameter");
    }

    if (type_unit == null) {
        type_unit = await utils.contract("SCPNSTypeUnit");
    }

    return [cobj, proof_parameter, type_unit];
}

async function postion_of(parameterId, tokenId, scale) {
    let prjs = await contracts();
    let cobj = prjs[0];
    return Number(await cobj.postionOf(parameterId, tokenId, scale));
}

async function parameters_of(tokenId) {
    let prjs = await contracts();
    let cobj = prjs[0];

    let parameterIds = await cobj.parameterIdsOf(tokenId);
    return parameterIds;
}

async function works() {
    let prjs = await contracts();
    let cobj = prjs[0];
    let proof_parameter = prjs[1];
    let type_unit = prjs[2];
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
        let parameter = JSON.parse(utils.w3str_to_str(await proof_parameter.parameterOf(parameters[i])));
        let scales = await cobj.scalesOf(parameters[i]);
        let type_unit_ids = await cobj.typeUnitIdsOf(parameters[i]);
        let t = {};
        for (let l = 0; l < type_unit_ids.length; l++) {
            let range  = await proof_parameter.computilityRangeOfTypeUnit(parameters[i], type_unit_ids[i]);
            let min = range[0].toString();
            let max = range[1].toString();
            logger.table({"min(s)": min, "max(s)": max}, "parameter = " + parameter_name + " typeUnitName( " + utils.w3bytes32_to_str(await type_unit.nameOf(type_unit_ids[l])) + ")");


            let s = {}
            for (let j = 0; j < scales.length; j++) {
                logger.debug("scale: " + scales[j]);
                let datas = [];
                let count = await cobj.countOf(parameters[i], scales[j], type_unit_ids[l]);
                logger.debug("count: " + count);
                for (var k = 0; k < count; k++) {
                    let xy = await cobj.excTimeByIndex(parameters[i], scales[j], type_unit_ids[l], k);
                    datas.push({
                        x: xy[0].toString(),
                        y: xy[1].toString(),
                    });
                    logger.debug(datas[datas.length -1]);
                }
                s[scales[j]] = datas;
                s["range"] = {
                    min: min,
                    max: max
                }
                logger.table(datas, "parameter = " + parameter_name + "(" + scales[j] + ")" + " typeUnitName( " + utils.w3bytes32_to_str(await type_unit.nameOf(type_unit_ids[l])) + ")");
            }
            t[utils.w3uint256_to_hex(type_unit_ids[l])] = s;
        }
        list[utils.w3uint256_to_hex(parameters[i])] = t;
        list["detail"] = parameter;
    } 

    return list;
}

module.exports = {
    works,
    parameters_of,
    postion_of
}
