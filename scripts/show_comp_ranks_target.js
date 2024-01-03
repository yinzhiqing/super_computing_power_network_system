
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const scr       = require("./show_comp_ranks_base.js");
const sur       = require("./use_rights_base.js");
async function works(use_right_id) {
    let type_unit_id = await sur.type_unit_id_of(use_right_id);
    let proof_parameter = await utils.contract("SCPNSProofParameter");
    let cobj = await utils.contract("SCPNSComputilityRanking");
    //let ranks = await scr.works();
    let parameterIds = await scr.parameters_of(use_right_id);
    let rights = await sur.datas_from_use_right_id(use_right_id);
    let use_right_info = rights["form"];
    let scale = 1;

    if (parameterIds.length > 0) {
        for (var i in parameterIds) {
            for(var k in use_right_info) {
                if (k.length >= 6) {
                    logger.log(k + "\t\t\t" + use_right_info[k].toString());
                } else {
                    logger.log(k + "\t\t\t\t" + use_right_info[k].toString());
                }
            }

            let para_id = parameterIds[i];
            let range = await proof_parameter.computilityRangeOfTypeUnit(para_id, type_unit_id);
            let verify_sample = Number(await proof_parameter.sampleOf(para_id));
            let parameter = JSON.parse(utils.w3str_to_str(await proof_parameter.parameterOf(para_id)));
            let postion   = await scr.postion_of(para_id, use_right_id, scale);

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
            let ranks_state = {
                "* 算力是否正常": state
            }

            logger.form("使用权通证算力信息表", use_right_info, ranks_info, ranks_state);
        }
    } else {
            let ranks_state = {
                "* 未进行算力证明": "",
            }
        logger.form("使用权通证算力信息表", use_right_info, ranks_state);
    }
}
async function run() {

    let use_right_id = "0x749a89a0dfc14119dda422c9f831dbe1454402694d7f52886c1bcde2aa94626e";
    let cobj     = await utils.contract("SCPNSUseRightToken");
    let amounts = await cobj.totalSupply();
    let list = [];
    for (let i = 0; i < amounts; i++) {
        use_right_id = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
        let owner    = await cobj.ownerOf(use_right_id);
        let cvmid    = utils.w3uint256_to_hex(await cobj.computilityVMIdOf(use_right_id));
        list.push({
            "使用权通证": use_right_id,
            "拥有者": owner,
            "资源ID": cvmid
        })
        await works(use_right_id);
    }
    logger.table(list);
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

