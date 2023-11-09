const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const units_cfg = require("./datas/units.config.js");

const {ethers, upgrades}    = require("hardhat");
const units                 = units_cfg.units;
const parameters            = units.parameters;
const def_parameters        = units.default_parameters;

async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);

    return has;
}

async function show_def_para() {
    logger.info(def_parameters);
}

async function init_def_parameters(type_unit, proof_parameter, gpu_list, signer) {
    logger.debug("init parameter...", "init def");

    // typeUnit list
    let rows = [];
    for(let key in def_parameters) {
        let row = {};

        row["type_unit_name"]   = key;
        row["para_name"]        = def_parameters[key];
        row["type_unit_id"]     = utils.w3uint256_to_hex(await type_unit.tokenIdOf(utils.str_to_w3bytes32(row["type_unit_name"])));
        row["gpu_id"]           = await type_unit.unitIdOf(row["type_unit_id"]);
        row["gpu_name"]         = utils.w3bytes32_to_str(await gpu_list.nameOf(row["gpu_id"]));

        let parameter_id        = utils.w3uint256_to_hex(await proof_parameter.tokenIdOf(utils.str_to_w3bytes32(row["para_name"])));


        let exists = await type_unit.exists(row["type_unit_id"]);
        if (!exists) {
            logger.debug("type unit id(" + row["type_unit_id"].toString() + ") is nonexists.");
            continue;
        }


        exists = await proof_parameter.exists(parameter_id);
        if (!exists) {
            logger.debug("parameter(" + parameter_id.toString() + ") is nonexists.");
            continue;
        }


        logger.debug("start set");
        /*
        let cur_parameter_id = utils.w3uint256_to_hex(await proof_parameter.parameterIdOfTypeUnitId(row["type_unit_id"]));
        if (cur_parameter_id == parameter_id) {
            logger.debug("parameter(" + parameter_id.toString() + ") was setted, next...");
            continue;
        }
        */
        logger.debug("set default parameter(" + parameter_id. toString() + ") of type unit(" + row["type_unit_id"] + ").");

        rows.push({
            gpu_name: row["gpu_name"],
            typeUnitId: utils.w3uint256_to_hex(row["type_unit_id"]).substr(0, 6),
            parameterId: utils.w3uint256_to_hex(parameter_id).substr(0, 6),
            parameterName: row["para_name"],

        })

        await proof_parameter.setDefaultTokenOf(row["type_unit_id"], parameter_id);
    }
    logger.table(rows, "new set def_parameters");
}

async function init_computility_range(type_unit, proof_parameter, gpu_list, signer) {
    logger.debug("init parameter...", "init range");

    // typeUnit list
    let rows = [];
    for(let key in parameters) {
        let row = {};
        row["para_name"]    = key;

        let parameter_id    = await proof_parameter.tokenIdOf(utils.str_to_w3bytes32(key));
        let computility     = parameters[key]["computility"];

        for (let ukey in computility) {
            row["type_unit_name"]   = ukey;
            row["type_unit_id"]     = await type_unit.tokenIdOf(utils.str_to_w3bytes32(row["type_unit_name"]));
            row["gpu_id"]           = await type_unit.unitIdOf(row["type_unit_id"]);
            row["gpu_name"]         = utils.w3bytes32_to_str(await gpu_list.nameOf(row["gpu_id"]));
            let parameter_id        = await proof_parameter.tokenIdOf(utils.str_to_w3bytes32(row["para_name"]));
            let min = computility[ukey]["min"];
            let max = computility[ukey]["max"];

            let exists = await type_unit.exists(row["type_unit_id"]);
            if (!exists) {
                logger.debug("type unit id(" + row["type_unit_id"].toString() + ") is nonexists.");
                continue;
            }

            let range = await proof_parameter.computilityRangeOfTypeUnit(parameter_id, row["type_unit_id"]);
            let cur_min = range[0];
            let cur_max = range[1];
            if (cur_min == min && cur_max == max) {
                logger.debug("type unit id(" + row["type_unit_id"].toString() + ") the same range was setted, next...");
                continue;
            }
            rows.push({
                gpu_name: row["gpu_name"],
                typeUnitId: utils.w3uint256_to_hex(row["type_unit_id"]).substr(0, 6),
                parameterId: utils.w3uint256_to_hex(parameter_id).substr(0, 6),
                parameterName: row["para_name"],
                min: min,
                max: max
            });
            //logger.debug(rows)
            logger.debug("set range of type unit id(" + parameter_id. toString() + ") of type unit(" + row["type_unit_id"] + ").");
            await proof_parameter.setComputilityRange(parameter_id, row["type_unit_id"], min, max);
        }

    }
    logger.table(rows, "new set range");
}

async function run() {
    logger.debug("start working...", "init parameters");

    let proof_parameter = await utils.contract("SCPNSProofParameter");
    let type_unit       = await utils.contract("SCPNSTypeUnit");
    let gpu_list        = await utils.contract("SCPNSGpuList");

    let role   = "MINTER_ROLE";
    let signer = ethers.provider.getSigner(0); 
    let minter = await signer.getAddress(); 

    let has_miter = await has_role(proof_parameter, minter, role);
    if (has_miter != true) {
        logger.error(minter + " no minter role." );
        return;
    } 

    await show_def_para();
    await init_def_parameters(type_unit, proof_parameter, gpu_list, signer);
    await init_computility_range(type_unit, proof_parameter, gpu_list, signer);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
