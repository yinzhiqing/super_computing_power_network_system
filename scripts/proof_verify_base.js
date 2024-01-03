const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle    = require('./merkle');
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

async function select_use_right_id_in_verify(signer_address, buf) {
    let use_right       = await utils.contract("SCPNSUseRightToken");
    let verify_task     = await utils.contract("SCPNSVerifyTask");
    let proof_task     = await utils.contract("SCPNSProofTask");

    let use_right_count = await use_right.totalSupply();

    //随机选择一个， 此处可指定固定使用权通证(use_right_id) 
    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
        /*
         * 1. 判断使用权通证对应的算力节点是否有挑战任务
         */
        let isInVerify   = await verify_task.isInVerifyOfUseRightId(use_right_id);
        if (!isInVerify) {
            logger.debug("useRight token(" + use_right_id +") is not in verify, next...");
            continue;
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
            continue;
        }
        return use_right_id;
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
async function verify(user, buf) {
    logger.warning("等待挑战");

    let use_right       = await utils.contract("SCPNSUseRightToken");
    let verify_task     = await utils.contract("SCPNSVerifyTask");

    let signer          = user.signer; 
    let signer_address  = await signer.getAddress();

    let rows = [];

    //这里可以指定一个特定的感兴趣的use_right_id
    let use_right_id = await select_use_right_id_in_verify(signer_address, buf);
    if (use_right_id == undefined || use_right_id == "") {
        logger.debug("没有需要验证的任务");
        return;
    }

    logger.debug("want verify useRight token(" + use_right_id +")");
    /*
     * 1. 判断使用权通证对应的算力节点是否有挑战任务
     */
    let isInVerify  = await verify_task.isInVerifyOfUseRightId(use_right_id);
    if (!isInVerify) {
        //logger.debug("useRight token(" + use_right_id +") is not in verify, return");
        return;
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
        return;
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

    logger.info("verify task: " + tokenId);
    await verify_task.connect(signer).taskVerify(
        tokenId/* 任务ID*/, q /* 路径对应的问题 */, proof /*路径*/, [] /* 位置用openzepplin的树时候不用此值*/);

    buf[tokenId + q] = true;
    logger.table(rows, "verify info");
}

async function create_merkle_datas(dynamicData, leaf_count, leaf_deep) {
    logger.table({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep}, "create merkle tree")
    //create merkle
    let merkle_root = merkle.get_root(dynamicData, leaf_count, leaf_deep);
    logger.info("merkle_root: " + merkle_root);
    return merkle_root;
}
async function select_use_right_id_in_proof(signer_address, buf) {
    //return use_right_id;
    let use_right       = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");
    let use_right_count = await use_right.totalSupply();
    let skeep = [''];

    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
        let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);

        if (skeep.includes(use_right_id)) {
            continue;
        }

        if (!isInProof) {
            //logger.debug("useRight token(" + use_right_id +") is not in proof, next...");
            continue;
        }
        let parameters  = await proof_task.latestParametersByUseRightId(use_right_id); 
        let taskId      = utils.w3uint256_to_hex(parameters[2]);

        let is_owner = await proof_task.isOwner(taskId, signer_address);
        if (!is_owner) {
            continue;
        }
        if(buf[taskId] == true) {
            logger.debug("task id(" + taskId +") was proof, next...");
            continue;
        }

        return use_right_id;
    }
    return "";
}

async function proof(user, buf) {

    logger.warning("等待算力证明...");

    logger.debug(buf);
    let use_right       = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");

    let signer = user.signer; 
    let signer_address  = await signer.getAddress();
    logger.debug("signer address: " + signer_address);

    let rows = []

    let use_right_id = await select_use_right_id_in_proof(signer_address, buf);
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

    let info = {
        use_right_id: use_right_id,
        taskId: taskId,
    }
    rows.push(info)

    let merkle_root = await create_merkle_datas(dynamicData, leaf_count, leaf_deep);
    let tx = await proof_task.connect(signer).taskEnd(taskId, merkle_root, utils.str_to_w3bytes32(""), false);
    logger.debug(tx);
    buf[taskId] = true;

    if (rows.length > 0) {
        logger.table(rows, "new tokens");
    }
}

module.exports = {
    verify,
    proof,
}
