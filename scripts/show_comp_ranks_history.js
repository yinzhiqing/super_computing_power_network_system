const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { spawn } = require('child_process');

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
            let type_unit_name = utils.w3bytes32_to_str(await type_unit.nameOf(type_unit_ids[l]));
            logger.debug(range);
            let min = range[0].toString();
            let max = range[1].toString();
            logger.table({"min(s)": min, "max(s)": max}, "parameter = " + parameter_name + " typeUnitName( " + type_unit_name + ")");

            let s = {}
            for (let j = 0; j < scales.length; j++) {
                logger.debug("scale: " + scales[j]);
                let datas = [];
                let count = await cobj.countOfHistory(parameters[i], scales[j], type_unit_ids[l]);
                logger.debug("count: " + count);
                for (var k = 0; k < count; k++) {
                    let xy = await cobj.excTimeHistoryByIndex(parameters[i], scales[j], type_unit_ids[l], k);
                    datas.push({
                        x: xy[0].toNumber(),
                        y: xy[1].toNumber(),
                    });
                    logger.debug(datas[datas.length -1]);
                }

                /*
                 * sort datas 
                 *
                 */
                let datas_sort = [];
                let key_sort = [];
                let temp = {};
                for(var idx in datas) {
                    key_sort.push(datas[idx]["x"]);
                    temp[datas[idx]["x"]] = datas[idx]["y"];
                }

                key_sort = key_sort.sort(function (a, b) { return a - b; });

                for (var idx in key_sort) {
                    datas_sort.push({
                        x: key_sort[idx],
                        y: temp[key_sort[idx]],
                    })
                }
                
                // sotrage datas_sort
                s[scales[j]] = datas_sort;
                logger.table(datas_sort, "parameter = " + parameter_name + "(" + scales[j] + ")" + " typeUnitName( " + type_unit_name + ")");
            }
            //t[utils.w3uint256_to_hex(type_unit_ids[l])] = s;
            t[type_unit_name] = s;
        }
        //list[utils.w3uint256_to_hex(parameters[i])] = t;
        list[parameter_name] = t;
    } 
    return list;
}

async function extract_from_map(datas) {
    let ret = [];
    if (Array.isArray(datas)) {
        return [{key: "", data: datas}];
    }

    //datas type is map
    for(var idx in datas) {
        let kv = await extract_from_map(datas[idx]);
        for (k in kv) {
            ret.push({
                key: kv[k]["key"] != ""  ? idx + "_" + kv[k]["key"] : idx + kv[k]["key"],
                data: kv[k]["data"]
            });
        }
    }
    return ret;
}
async function convert_to_config(list) {

    logger.debug("convert_to_config list");
    let datas = await extract_from_map(list);

    let plots = [];
    for (i in datas) {
        let plot = {};
        plot["title"] = datas[i]["key"];
        plot["type"] = "plot";
        let pixs = datas[i]["data"];
        let x = [];
        let y = [];
        for (idx in pixs) {
            x.push(pixs[idx]["x"].toString());
            y.push(pixs[idx]["y"]);
        }

        plot["x"] = x;
        plot["y"] = y;

        plots.push(plot);
    }

    let config = {
        libname: "matplotx",
        rows: datas.length,
        cols: 1,
        xlabel: "time",
        ylabel: "count",
        plots: plots
    };

    return config;

}
async function show_gr(list) {
    const config =  await convert_to_config(list);
    logger.debug(config);
    const python    = spawn('python', ['pyscripts/plot.py', JSON.stringify(config)]);
    python.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    python.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    python.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

}

async function run() {
    logger.debug("start working...", "show_tokens");
    let list = await show_tokens();
    await show_gr(list);
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

