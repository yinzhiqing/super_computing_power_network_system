const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const sur       = require("./use_rights_base.js");

async function postion_of(parameterId, tokenId, scale) {
    let cobj = await utils.contract("SCPNSComputilityRanking");
    return Number(await cobj.postionOf(parameterId, tokenId, scale));
}

async function parameters_of(tokenId) {
    let cobj = await utils.contract("SCPNSComputilityRanking");

    let parameterIds = await cobj.parameterIdsOf(tokenId);
    return parameterIds;
}
// 不同类型算力资源排行数据
async function comp_ranks() {
    let cobj            = await utils.contract("SCPNSComputilityRanking");
    let proof_parameter = await utils.contract("SCPNSProofParameter");
    let type_unit       = await utils.contract("SCPNSTypeUnit");
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
            let range  = await proof_parameter.computilityRangeOfTypeUnit(parameters[i], type_unit_ids[l]);
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

//排行历史数据
async function comp_ranks_history() {
    let cobj            = await utils.contract("SCPNSComputilityRanking");
    let proof_parameter = await utils.contract("SCPNSProofParameter");
    let type_unit       = await utils.contract("SCPNSTypeUnit");
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
            let range  = await proof_parameter.computilityRangeOfTypeUnit(parameters[i], type_unit_ids[l]);
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

//指定使用权通证的算力水平信息以表单的形式汇总
async function datas_with_ranks_from_use_right_id(use_right_id) {
    let type_unit_id = await sur.type_unit_id_of(use_right_id);
    let proof_parameter = await utils.contract("SCPNSProofParameter");
    let cobj = await utils.contract("SCPNSComputilityRanking");
    let parameterIds = await parameters_of(use_right_id);
    let rights = await sur.datas_from_use_right_id(use_right_id);
    let use_right_info = rights.form;
    let scale = 1;
    let ranks_infos = [];
    if (parameterIds.length > 0) {
        for (var i in parameterIds) {
            let para_id = parameterIds[i];
            let range = await proof_parameter.computilityRangeOfTypeUnit(para_id, type_unit_id);
            let verify_sample = Number(await proof_parameter.sampleOf(para_id));
            let parameter = JSON.parse(utils.w3str_to_str(await proof_parameter.parameterOf(para_id)));
            let postion   = await postion_of(para_id, use_right_id, scale);

            let ranks_info = {
                "算力有效范围(秒)": Number(range[0]) + " ~ " + Number(range[1]),
                "实际证明时间(秒)": Number(postion),
                "采样次数(次)": verify_sample,
                "证明难度": "",
                "   叶子数量(个)": parameter["leaf_count"],
                "   叶子hash深度(次)": parameter["leaf_deep"],
            }

            //统计排行表
            //logger.log("排行表:");
            let count = await cobj.countOf(para_id, scale, type_unit_id);
            let xs = [];
            let ys = [];
            let xyt = {};
            for (var j = 0; j < count; j++) {
                let xy = await cobj.excTimeByIndex(para_id, scale, type_unit_id, j);
                let x = Number(xy[0]);
                let y = Number(xy[1]);
                xs.push(x);
                xyt[x] = y;
            }
            xs = xs.sort(function (a, b) { return a - b;});
            xs.forEach(e => {ys.push(xyt[e]); });
            let state = "异常";
            if (postion <= range[1]) {
                state = "正常";
            }

            if (postion <= range[0]) {
                state += "(小于规定值范围)"
            }
            ranks_info["* 算力状态"] = state;

            ranks_infos.push(ranks_info);
            //logger.form("使用权通证算力信息表", use_right_info, ranks_info, ranks_state);
        }
    } else {
        let ranks_info = {
            "* 算力状态": "未进行算力证明",
        }
        ranks_infos.push(ranks_info);
        //logger.form("使用权通证算力信息表", use_right_info, ranks_state);
    }
    return {
        form: {
            title :         "使用权通证算力信息表",
            use_right_info: use_right_info,
            ranks_infos:    ranks_infos
        }
    }
}

//以表单的形式显示指定使用权通证的算力水平
async function show_ranks_from_use_right_id(use_right_id) {
    let datas = await datas_with_ranks_from_use_right_id(use_right_id);
    
    let use_right_info  = datas.form.use_right_info;
    let title           = datas.form.title;
    let ranks_infos     = datas.form.ranks_infos;
    for(let i in ranks_infos) {
        let args = [title, use_right_info, ranks_infos[i]];
        logger.form.apply(null, args);
    }
}

module.exports = {
    datas_with_ranks_from_use_right_id,
    comp_ranks,
    comp_ranks_history,
    show_ranks_from_use_right_id,
    parameters_of,
    postion_of
}
