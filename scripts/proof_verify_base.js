const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle    = require('./merkle');
const crb       = require("./comp_ranks_base.js");
const { contracts_load } = require("./contracts.js");

async function get_leaf_index(leaf, dynamicData, leaf_count, leaf_deep) {
    let index = merkle.get_leaf_index_by_hash(leaf, dynamicData, leaf_count, leaf_deep);
    logger.info("leaf index: " + index);
    return index;
}

// 获取证明值: 路径节点
async function get_proof(leaf, dynamicData, leaf_count, leaf_deep) {
    logger.table({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep}, "get proof")
    //create merkle
    let proof = merkle.get_proof_by_hash(leaf, dynamicData, leaf_count, leaf_deep);
    logger.debug("proof: " + proof);
    return proof;
}
async function check_use_right_id_can_verify(use_right_id, signer_address, buf) {
    assert(use_right_id != false, "use_right_id(" + use_right_id + ") is invalid argument.");

    let use_right       = await utils.contract("SCPNSUseRightToken");
    let verify_task     = await utils.contract("SCPNSVerifyTask");
    let proof_task      = await utils.contract("SCPNSProofTask");

    /*
     * 1. 判断使用权通证对应的算力节点是否有挑战任务
     */
    let isInVerify   = await verify_task.isInVerifyOfUseRightId(use_right_id);
    if (!isInVerify) {
        logger.debug("useRight token(" + use_right_id +") is not in verify, next...");
        return false;
    }

    /*
     * 2. 获取算力使用权通证对应的算力证明参数（此处是确认proofId是否是当前最新的且完成的算力证明任务对应的数据）
     */
    let proof_parameters = await verify_task.proofParametersByUseRightId(use_right_id);
    let proofId     = utils.w3uint256_to_hex(proof_parameters[2]); // 算力证明任务ID
    // 只对自己证明的挑战感兴趣
    let is_owner = await proof_task.isOwner(proofId, signer_address);
    if (!is_owner) {
        logger.debug("owner of proof task id(" + proofId +") is not signer, next...");
        return false;
    }

    return true;
}
async function select_use_right_id_in_verify(signer_address, buf, fixed_use_right_id = null) {
    let use_right       = await utils.contract("SCPNSUseRightToken");
    let verify_task     = await utils.contract("SCPNSVerifyTask");
    let proof_task      = await utils.contract("SCPNSProofTask");

    let use_right_count = await use_right.totalSupply();

    //使用固定使用权通证
    if(fixed_use_right_id != null) {
        logger.debug("use fixed use_right_id: " + use_right_id);
        let valid = await check_use_right_id_can_verify(fixed_use_right_id, signer_address, buf);
        if(valid == true) {
            return fixed_use_right_id;
        }
    } else {
        //随机选择一个， 此处可指定固定使用权通证(use_right_id) 
        logger.debug("select use_right_id ");
        for (var i = 0; i < use_right_count; i++) {
            let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
            let valid = await check_use_right_id_can_verify(use_right_id, signer_address, buf);
            if (valid == true)  {
                return use_right_id;
            }
        }
    }
    return "";
}
/*
 * 此函数完成挑战
 *
 * 被挑战者从本地选择问题答案(叶子序号， 路径)并回答
 * 问题正确与否会在自动计算
 *
 */
async function verify(user, buf, fixed_use_right_id = null) {
    logger.warning("等待挑战");

    let use_right       = await utils.contract("SCPNSUseRightToken");
    let verify_task     = await utils.contract("SCPNSVerifyTask");

    let signer          = user.signer; 
    let signer_address  = await signer.getAddress();

    let rows = [];

    //这里可以指定一个特定的感兴趣的use_right_id
    let use_right_id = await select_use_right_id_in_verify(signer_address, buf, fixed_use_right_id);
    if (use_right_id == undefined || use_right_id == "") {
        logger.debug("没有需要验证的任务");
        return null;
    }

    logger.debug("want verify useRight token(" + use_right_id +")");
    /*
     * 1. 判断使用权通证对应的算力节点是否有挑战任务
     */
    let isInVerify  = await verify_task.isInVerifyOfUseRightId(use_right_id);
    if (!isInVerify) {
        //logger.debug("useRight token(" + use_right_id +") is not in verify, return");
        return null;
    }

    /*
     * 2. 获取算力使用权通证对应的算力证明参数（此处是确认proofId是否是当前最新的且完成的算力证明任务对应的数据）
     */
    let proof_parameters = await verify_task.proofParametersByUseRightId(use_right_id);
    let dynamicData = utils.w3uint256_to_hex(proof_parameters[0]);
    let parameter   = JSON.parse(utils.w3str_to_str(proof_parameters[1]));
    let leaf_count  = parameter["leaf_count"];
    let leaf_deep   = parameter["leaf_deep"];

    logger.debug("dynamicData: " + dynamicData);

    //测试生成Merkle树用
    /*
     * 3. 获取当前挑战问题及信息
     */
    let parameters  = await verify_task.verifyParameterOfUseRightId(use_right_id); 

    let tokenId     = parameters[0];
    let q           = parameters[1];
    let state       = parameters[2];

    tokenId = utils.w3uint256_to_hex(tokenId);
    if(buf[tokenId + q] == true) {
        return tokenId;
    }

    logger.debug("tokenId: " + utils.w3uint256_to_hex(parameters[0])); // 挑战任务ID
    logger.debug("q      : " + q.toString()); //挑战问题
    logger.debug("state  : " + state);

    let residue_verify = Number(await verify_task.residueVerifyOf(parameters[0]));
    logger.debug(">> residue Verify: " + residue_verify);

    /*
     * 4根据挑战问题q 选择对应的proof(路径)
     */
    let proof       = await get_proof(q, dynamicData, leaf_count, leaf_deep);

    rows.push({
        use_right_id: use_right_id,
        token_id: tokenId,
        residue_verify: residue_verify
    })


    /* 5. 
     * 回答挑战问题, 将根据回答问题有效性进行对错次数统计
     */
    let index = await get_leaf_index(q, dynamicData, leaf_count, leaf_deep);
    logger.debug("q_index: " + index);

    logger.debug("verify task: " + tokenId);
    await verify_task.connect(signer).taskVerify(
        tokenId/* 任务ID*/, q /* 路径对应的问题 */, proof /*路径*/, [] /* 位置用openzepplin的树时候不用此值*/);

    buf[tokenId + q] = true;
    logger.debug(rows, "verify info");

    //显示排行信息
    if(residue_verify == 1) {
        while(residue_verify == 1) {
            residue_verify = Number(await verify_task.residueVerifyOf(parameters[0]));
            await utils.sleep(2);
        }
        await crb.show_ranks_from_use_right_id(use_right_id);
    }
    
    return tokenId;
}

async function create_merkle_datas(dynamicData, leaf_count, leaf_deep) {
    logger.table({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep}, "create merkle tree")
    //create merkle
    let merkle_root = merkle.get_root(dynamicData, leaf_count, leaf_deep);
    logger.info("merkle_root: " + merkle_root);
    return merkle_root;
}

async function check_use_right_id_can_proof(use_right_id, signer_address, buf) {
    assert(use_right_id != false, "use_right_id is invalid argument.");

    let use_right       = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");
    let use_right_count = await use_right.totalSupply();

    let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);
    if (!isInProof) {
        //logger.debug("useRight token(" + use_right_id +") is not in proof, next...");
        return false;
    }
    let parameters  = await proof_task.latestParametersByUseRightId(use_right_id); 
    let taskId      = utils.w3uint256_to_hex(parameters[2]);

    if(buf[taskId] == true) {
        logger.debug("task id(" + taskId +") was proof, next...");
        return false;
    }

    let is_owner = await proof_task.isOwner(taskId, signer_address);
    if (!is_owner) {
        return false;
    }
    return true;
}

async function select_use_right_id_in_proof(signer_address, buf, fixed_use_right_id = null) {
    //return use_right_id;
    let use_right       = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");
    let use_right_count = await use_right.totalSupply();

    //
    if(fixed_use_right_id != null) {
        let valid = await check_use_right_id_can_proof(fixed_use_right_id, signer_address, buf);
        if(valid == true) {
            return fixed_use_right_id;
        }
    } else {
        for (var i = 0; i < use_right_count; i++) {
            let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
            let valid = await check_use_right_id_can_proof(use_right_id, signer_address, buf);
            if(valid == true) {
                return use_right_id;
            }
        }
    }
    return "";
}

async function proof(user, buf, fixed_use_right_id = null) {

    logger.warning("等待算力证明...");

    let use_right       = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");

    let signer = user.signer; 
    let signer_address  = await signer.getAddress();
    logger.debug("signer address: " + signer_address);

    let rows = []

    let use_right_id = await select_use_right_id_in_proof(signer_address, buf, fixed_use_right_id);
    if (use_right_id == undefined || use_right_id == "") {
        return;
    }
    logger.debug("check use_right_id: " + use_right_id);

    let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);
    if (!isInProof) {
        logger.debug("useRight token(" + use_right_id +") is not in proof, next...");
        return;
    }

    //[dynamicData, parameter, taskId, has]  
    let parameters  = await proof_task.connect(signer).latestParametersByUseRightId(use_right_id); 
    logger.debug(parameters);
    let dynamicData = utils.w3uint256_to_hex(parameters[0]);
    let parameter   = JSON.parse(utils.w3str_to_str(parameters[1]));
    let leaf_count  = parameter["leaf_count"];
    let leaf_deep   = parameter["leaf_deep"];
    let taskId      = utils.w3uint256_to_hex(parameters[2]);

    let is_owner = await proof_task.isOwner(taskId, signer_address);
    if (!is_owner) {
        logger.debug(" owner of proof task id(" + taskId +") is not signer, next...");
        return;
    }

    logger.debug("update: " + use_right_id);

    logger.debug("dynamicData: " + dynamicData, "parameters of use_right_id(" + use_right_id + ")");
    logger.debug("parameter: " + utils.w3str_to_str(parameters[1]));
    logger.debug("taskId: " + taskId);
    logger.debug("has: " + parameters[3]);


    let merkle_root = await create_merkle_datas(dynamicData, leaf_count, leaf_deep);
    let tx = await proof_task.connect(signer).taskEnd(taskId, merkle_root, utils.str_to_w3bytes32(""), false);

    buf[taskId] = true;

    let info = {
        use_right_id: use_right_id,
        taskId: taskId,
    }

    rows.push(info)

    if (rows.length > 0) {
        logger.table(rows, "new tokens");
    }
}

//显示指定数量的挑战任务及信息
async function show_verify_tasks(latest_count) {
    let cobj        = await utils.contract("SCPNSVerifyTask");
    let name        = await cobj.name();
    let amounts     = await cobj.totalSupply();

    let list        = [];
    let detail      = {};
    let detail_of   = {};

    logger.debug("挑战任务信息");
    logger.debug("token address: " + cobj.address);
    logger.debug("name: " + name);
    logger.debug("totalSupply: " + amounts);

    let start = utils.min_from_right(amounts, latest_count);
    for (let i = start; i < amounts; i++) {
        let row = new Map();
        row["tokenId"] = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
        row["owner"] = utils.w3uint256_to_hex(await cobj.ownerOf(row["tokenId"]));
        logger.debug(">> tokenId; "     + row["tokenId"], "verify info");
        row["use_right_id"] = utils.w3uint256_to_hex(await cobj.useRightIdOf(row["tokenId"]));
        row["isInVerify"] = await cobj.isInVerifyOf(row["tokenId"]);
        logger.debug(">> isInVerify; "     + row["isInVerify"]);

        let parameters = await cobj.verifyParameterOf(row["tokenId"]);
        logger.debug(">> useRightId: "  + utils.w3uint256_to_hex(parameters[0]));

        logger.debug(">> q: "    + parameters[1]);
        logger.debug(">> state :" + parameters[2].toString());

        let residue_verify = Number(await cobj.residueVerifyOf(row["tokenId"]));
        logger.debug(">> residue Verify: " + residue_verify);

        let verify_stat = await cobj.verifyStatOfUseRightId(row["use_right_id"]);
        logger.debug(">> verify stat: [t, s, f] " + verify_stat);

        let verify_stat_of = await cobj.verifyStatOf(row["tokenId"]);
        logger.debug(">> verify stat of: [t, s, f] " + verify_stat_of);

        let use_right_id_sub = (row["use_right_id"].toString()).substr(0, 6);

        detail[use_right_id_sub] = "verify [t, s, f]  " + verify_stat;
        detail[use_right_id_sub] = {
            total: Number(verify_stat[0].toString()),
            succees: Number(verify_stat[1].toString()),
            failed: Number(verify_stat[2].toString()),
        };

        detail_of[row["tokenId"]] = "verify [t, s, f]  " + verify_stat_of;
        detail_of[row["tokenId"]] = {
            use_right_id: use_right_id_sub,
            total: Number(verify_stat_of[0].toString()),
            succees: Number(verify_stat_of[1].toString()),
            failed: Number(verify_stat_of[2].toString()),
            residue_verify: residue_verify,
            isVerified: await cobj.isVerified(row["tokenId"])
        };

        //reset key-value
        row["use_right_id"] = use_right_id_sub;

        list.push(row);

    } 
    logger.table(detail, "使用权通证证明统计");
    logger.table(detail_of, "使用权通证挑战任务信息 "); 
    logger.table(list, "使用权通证挑战状态信息");
}

module.exports = {
    verify,
    proof,
    show_verify_tasks,
}
