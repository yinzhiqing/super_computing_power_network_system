const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const readline  = require('readline');
const merkle    = require("./merkle");

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

async function create_merkel_datas(dynamicData, leaf_count, leaf_deep) {
    logger.table({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep}, "create merkel tree")
    //create merkel
    //test root 
    let merkel_root = web3.utils.soliditySha3(dynamicData, leaf_count, leaf_deep);
    logger.info("merkel_root: " + merkel_root);
    return merkel_root;
}

async function select_use_right_id() {
    let use_right = await contract("SCPNSUseRightToken");
    let use_right_count = await use_right.totalSupply();
    let proof_task      = await contract("SCPNSProofTask");

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
    let proof_task      = await contract("SCPNSProofTask");
    //算力使用权通证持有者或发布算力证明时设置的to用户； mint(to, use_right_id). 
    let signer = ethers.provider.getSigner(0); 
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

    //生成Merkel树, 并获取树根
    let merkel_root = await create_merkel_datas(dynamicData, leaf_count, leaf_deep);



    //结果上链,更新目标任务(taskId)对应的状态
    let tx = await proof_task.connect(signer).taskEnd(taskId, merkel_root, utils.str_to_w3bytes32(""));
    logger.debug(tx);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
