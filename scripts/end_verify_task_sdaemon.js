

const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle  = require('./merkle');

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function get_contract(name, address) {
    return await utils.get_contract(name, address);
}

async function show_accounts() {
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);
}

async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);

    return has;
}

async function count_of(client) {
    let count = await client.totalSupply();
    logger.debug(count);
    return count;
}

async function new_token_id(pre) {
    var date = new Date();
    return web3.utils.sha3(pre + date.getTime().toString());
}

async function contract(name) {
    let token = tokens[name];
    return await get_contract(token.name, token.address);
}

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
    logger.debug("start working...", "mint");

    let use_right = await contract("SCPNSUseRightToken");
    let verify_task      = await contract("SCPNSVerifyTask");

    let signer = ethers.provider.getSigner(0); 

    let use_right_count = await use_right.totalSupply();

    let to = await signer.getAddress();

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
        logger.debug("dynamicData: " + dynamicData);

        //测试生成Merkle树用
        let parameter   = JSON.parse(utils.w3str_to_str(proof_parameters[1]));
        let leaf_count  = parameter["leaf_count"];
        let leaf_deep   = parameter["leaf_deep"];

        let proofId      = utils.w3uint256_to_hex(proof_parameters[2]); // 算力证明任务ID
        logger.debug("proofId: " + proofId);

        /*
         * 3. 获取当前挑战问题及信息
         */
        let parameters  = await verify_task.verifyParameterOfUseRightId(use_right_id); 

        let tokenId = parameters[0];
        let q = parameters[1];
        logger.debug("tokenId: " + utils.w3uint256_to_hex(parameters[0])); // 挑战任务ID
        logger.debug("q: " + parameters[1].toString()); //挑战问题
        logger.debug("state: " + parameters[2]);

        /*
         * 4根据挑战问题q 选择对应的proof(路径)
         */
        let proof = await get_proof(q, dynamicData, leaf_count, leaf_deep);
        //获取对应的叶子节点序号
        let a = await get_leaf_index(q, dynamicData, leaf_count, leaf_deep);

        rows.push({
            use_right_id: use_right_id,
            token_id: tokenId
        })


        /* 5. 
         * 回答挑战问题, 将根据回答问题有效性进行对错次数统计
         */
        let tx = await verify_task.connect(signer).taskVerify(parameters[0]/* 任务ID*/, a /* 叶节点序号*/, proof /*路径*/, [] /* 位置*/);
        
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
