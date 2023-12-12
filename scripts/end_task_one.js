const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const readline  = require('readline');
const merkle    = require("./merkle");
const { users }       = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function create_merkle_datas(dynamicData, leaf_count, leaf_deep) {
    logger.table({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep}, "create merkle tree")
    //create merkle
    //test root 
    let merkle_root = merkle.get_root(dynamicData, leaf_count, leaf_deep);
    logger.info("merkle_root: " + merkle_root);
    return merkle_root;
}

async function select_use_right_id() {
    let use_right       = await utils.contract("SCPNSUseRightToken");
    let use_right_count = await utils.use_right.totalSupply();
    let proof_task      = await utils.contract("SCPNSProofTask");

    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
        let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);

        if (!isInProof) {
            logger.info("useRight token(" + use_right_id +") is not in proof, next...");
            continue;
        }
        return use_right_id;
    }
}
async function run() {
    logger.debug("start working...", "mint");

    //初始化合约、钱包，从配置文件读取算力节点对应的通证ID
    let proof_task      = await utils.contract("SCPNSProofTask");
    //算力使用权通证持有者或发布算力证明时设置的to用户； mint(to, use_right_id). 
    let signer = users.prover.signer; 
    //算力节点对应的通证ID
    let use_right_id = select_use_right_id();


    //判断通证id是否需要生成证明信息
    let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);
    if (!isInProof) {
        logger.info("useRight token(" + use_right_id +") is not in proof, next...");
        return;
    }

    //获取执行证明需要的参数
    //dynamicData: 此次证明用到的随机数,
    //parameter: json格式, 存储叶子节点数和叶子节点计算迭代数（深度）, 
    //taskId: 任务ID , 
    //has: 此处不用 
    let parameters  = await proof_task.connect(signer).latestParametersByUseRightId(use_right_id); 
    let dynamicData = web3.utils.toHex(parameters[0].toString());
    logger.info("parameter: " + parameters[1]);
    let parameter   = JSON.parse(utils.w3str_to_str(parameters[1]));
    let leaf_count  = parameter["leaf_count"];
    let leaf_deep   = parameter["leaf_deep"];
    let taskId      = parameters[2];

    //生成Merkle树, 并获取树根
    let merkle_root = await create_merkle_datas(dynamicData, leaf_count, leaf_deep);



    //结果上链,更新目标任务(taskId)对应的状态
    let tx = await proof_task.connect(signer).taskEnd(taskId, merkle_root, utils.str_to_w3bytes32(""));
    logger.debug(tx);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
