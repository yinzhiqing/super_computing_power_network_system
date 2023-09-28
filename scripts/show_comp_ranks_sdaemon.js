const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function work() {
    let cobj            = await utils.contract("SCPNSComputilityRanking");
    let proof_parameter = await utils.contract("SCPNSProofParameter");
    logger.warning("算力排行");

    let name = await cobj.name();
    logger.debug("name: " + name);

    logger.debug("pricision: " + await cobj.pricision());
    let def_param = await proof_parameter.defaultToken();
    logger.debug("default_parameter_id: " + def_param);
    


    let parameters = await cobj.parameters();
    let list = {};
    for (let i = 0; i < parameters.length; i++) {
        logger.debug("parameter: " + parameters[i]);
        // only show default parameter
        if (parameters[i].toString() != def_param.toString()) {
            logger.debug("parameter: " + parameters[i]);
            logger.debug("def parameter: " + def_param);
            continue;
        }
        logger.debug("...");
        let parameter_name = utils.w3bytes32_to_str(await proof_parameter.nameOf(parameters[i]));
        let scales = await cobj.scalesOf(parameters[i]);
        let s = {}
        for (let j = 0; j < scales.length; j++) {
            logger.debug("scale: " + scales[j]);
            let datas = [];
            let count = await cobj.countOf(parameters[i], scales[j]);
            logger.debug("count: " + count);
            for (var k = 0; k < count; k++) {
                let xy = await cobj.excTimeByIndex(parameters[i], scales[j], k);
                datas.push({
                    x: xy[0].toString(),
                    y: xy[1].toString(),
                });
                logger.debug(datas[datas.length -1]);
            }
            s[scales[j]] = datas;
            logger.table(datas, "parameter = " + parameter_name + "(" + scales[j] + ")");
        }
        list[utils.w3uint256_to_hex(parameters[i])] = s;
    } 
}

async function run(times) {
    logger.debug("show computility os");
    await utils.scheduleJob(times, work, null, true);
}

run(4)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

