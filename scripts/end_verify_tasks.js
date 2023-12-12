
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle  = require('./merkle');
const {users}       = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function get_leaf_index(leaf, dynamicData, leaf_count, leaf_deep) {
    let index = merkle.get_leaf_index_by_hash(leaf, dynamicData, leaf_count, leaf_deep);
    logger.info("leaf index: " + index);
    return index;
}

// 获取证明值: 路径节点
async function get_proof(leaf, dynamicData, leaf_count, leaf_deep) {
    logger.table({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep}, "create merkle tree")
    //create merkle
    let proof = merkle.get_proof_by_hash(leaf, dynamicData, leaf_count, leaf_deep);
    logger.info("proof: " + proof);
    return proof;
}
/*
 * 此函数完成挑战
 *
 * 被挑战者从本地选择问题答案(叶子序号， 路径)并回答
 * 问题正确与否会在自动计算
 *
 */
async function run() {
    logger.debug("start working...", "end_verify_tasks");

    let use_right        = await utils.contract("SCPNSUseRightToken");
    let verify_task      = await utils.contract("SCPNSVerifyTask");
    let proof_task      = await utils.contract("SCPNSProofTask");

    
    let signer = users.prover.signer; 
    let signer_address  =  await signer.getAddress();
    let use_right_count = await use_right.totalSupply();

    let rows = [];

    //随机选择一个， 此处可指定固定使用权通证(use_right_id) 
    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));

        /*
         * 1. 判断使用权通证对应的算力节点是否有挑战任务
         */
        let isInVerify = await verify_task.isInVerifyOfUseRightId(use_right_id);
        if (!isInVerify) {
            logger.info("useRight token(" + use_right_id +") is not in verify, next...");
            continue;
        } else {
            logger.info("update: " + use_right_id);
        }

        /*
         * 2. 获取算力使用权通证对应的算力证明参数（此处是确认proofId是否是当前最新的且完成的算力证明任务对应的数据）
         */
        let proof_parameters = await verify_task.proofParametersByUseRightId(use_right_id);
        let dynamicData = utils.w3uint256_to_hex(proof_parameters[0]);
        let parameter   = JSON.parse(utils.w3str_to_str(proof_parameters[1]));
        let proofId     = utils.w3uint256_to_hex(proof_parameters[2]); // 算力证明任务ID
        let leaf_count  = parameter["leaf_count"];
        let leaf_deep   = parameter["leaf_deep"];

        logger.debug("dynamicData: " + dynamicData);
        logger.debug("proofId    : " + proofId);

        // 只对自己证明的挑战感兴趣
        let is_owner = await proof_task.isOwner(proofId, signer_address);
        if (!is_owner) {
            logger.info(" owner of proof task id(" + proofId +") is not signer, next...");
            continue;
        }

        //测试生成Merkle树用

        /*
         * 3. 获取当前挑战问题及信息
         */
        let parameters  = await verify_task.verifyParameterOfUseRightId(use_right_id); 

        let tokenId = parameters[0];
        let q = parameters[1];

        logger.debug("tokenId  : " + utils.w3uint256_to_hex(parameters[0])); // 挑战任务ID
        logger.debug("q        : " + parameters[1]); //挑战问题
        logger.debug("state    : " + parameters[2]);

        /*
         * 4根据挑战问题q 选择对应的proof(路径)
         */
        let proof = await get_proof(q, dynamicData, leaf_count, leaf_deep);

        rows.push({
            use_right_id: use_right_id,
            token_id: tokenId
        })

        /* 5. 
         * 回答挑战问题, 将根据回答问题有效性进行对错次数统计
         */
        let index = await get_leaf_index(q, dynamicData, leaf_count, leaf_deep);
        logger.debug("q_index: " + index);
        let tx = await verify_task.connect(signer).taskVerify(parameters[0]/* 任务ID*/, q /* 问题*/, proof /*路径*/, [] /* 位置*/);
        
        break;
    }
    logger.table(rows, "new tokens");
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
