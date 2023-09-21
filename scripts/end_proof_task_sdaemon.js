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

async function new_token_id(pre) {
    var date = new Date();
    return web3.utils.sha3(pre + date.getTime().toString());
}

async function create_merkle_datas(dynamicData, leaf_count, leaf_deep) {
    logger.table({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep}, "create merkle tree")
    //create merkle
    let merkle_root = merkle.get_root(dynamicData, leaf_count, leaf_deep);
    logger.info("merkle_root: " + merkle_root);
    return merkle_root;
}
async function load_use_right_id(signer_address) {
    //return use_right_id;
    let use_right = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");
    let use_right_count = await use_right.totalSupply();

    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
        let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);

        if (!isInProof) {
            logger.debug("useRight token(" + use_right_id +") is not in proof, next...");
            continue;
        }
        let parameters  = await proof_task.latestParametersByUseRightId(use_right_id); 
        let taskId      = utils.w3uint256_to_hex(parameters[2]);

        let owner = await proof_task.ownerOf(taskId);
        if (owner != await signer_address) {
            logger.info("owner "+ owner +" of proof task id(" + taskId +") is not signer " + signer_address + ", next...");
            continue;
        }
        return use_right_id;
    }
    throw "没有找到可用使用权通证········";

}

async function work(buf) {

    logger.warning("等待算力证明...");

    let use_right = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");

    let signer = ethers.provider.getSigner(0); 
    let signer_address = await signer.getAddress();

    let rows = []

    let use_right_id = await load_use_right_id(signer_address);
    logger.warning("check use_right_id: " + use_right_id);

    let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);
    if (!isInProof) {
        logger.info("useRight token(" + use_right_id +") is not in proof, next...");
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

    let owner = await proof_task.ownerOf(taskId);
    if (owner != await signer.getAddress()) {
        logger.info("owner of proof task id(" + taskId +") is not signer, next...");
        return;
    }

    if(buf[taskId] == true) {
        return;
    }
    logger.info("update: " + use_right_id);

    logger.debug("dynamicData: " + dynamicData, "parameters of use_right_id(" + use_right_id + ")");
    logger.debug("parameter: " + utils.w3str_to_str(parameters[1]));
    logger.debug("taskId: " + taskId);
    logger.debug("has: " + parameters[3]);

    let info = {
        use_right_id: use_right_id,
        taskId: parameters[2].toString(),
    }
    rows.push(info)

    let merkle_root = await create_merkle_datas(dynamicData, leaf_count, leaf_deep);
    let tx = await proof_task.connect(signer).taskEnd(taskId, merkle_root, utils.str_to_w3bytes32(""), false);

    buf[taskId] = true;
    if (rows.length > 0) {
        logger.table(rows, "new tokens");
    }
}

async function run(times) {
    let buf = {};
    await utils.scheduleJob(times, work, buf);
}

run(3)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
