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
async function load_use_right_id(signer_address, buf) {
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
            logger.debug("useRight token(" + use_right_id +") is not in proof, next...");
            continue;
        }
        let parameters  = await proof_task.latestParametersByUseRightId(use_right_id); 
        let taskId      = utils.w3uint256_to_hex(parameters[2]);

        let is_owner = await proof_task.isOwner(taskId, signer_address);
        if (!is_owner) {
            logger.info(" owner of proof task id(" + taskId +") is not signer, next...");
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

async function work(buf) {

    logger.warning("等待算力证明...");

    let use_right       = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");

    let signer = users.prover.signer; 
    let signer_address  = await signer.getAddress();

    let rows = []

    let use_right_id = await load_use_right_id(signer_address, buf);
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

async function run(times) {
    let buf = {};
    await utils.scheduleJob(times, work, buf, false, 30);
}

run(3)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
