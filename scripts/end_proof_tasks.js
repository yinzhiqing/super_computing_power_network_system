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

async function create_merkle_datas(dynamicData, leaf_count, leaf_deep) {
    logger.table({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep}, "create merkle tree")
    //create merkle
    let merkle_root = merkle.get_root(dynamicData, leaf_count, leaf_deep);
    logger.info("merkle_root: " + merkle_root);
    return merkle_root;
}

async function run() {
    logger.debug("start working...", "mint");

    let use_right = await contract("SCPNSUseRightToken");
    let proof_task      = await contract("SCPNSProofTask");

    let signer = ethers.provider.getSigner(0); 

    let use_right_count = await use_right.totalSupply();

    let to = await signer.getAddress();

    let rows = [];

    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
        let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);

        if (!isInProof) {
            logger.info("useRight token(" + use_right_id +") is not in proof, next...");
            continue;
        } else {
            logger.info("update: " + use_right_id);
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
        if (owner != signer.getAddress()) {
            logger.info(" owner of proof task id(" + taskId +") is not signer, next...");
            continue;
        }

        logger.debug("dynamicData: " + dynamicData, "parameters of use_right_id(" + use_right_id + ")");
        logger.debug("parameter: " + utils.w3str_to_str(parameters[1]));
        logger.debug("taskId: " + taskId);
        logger.debug("has: " + parameters[3]);

        let info = {
            use_right_id: use_right_id,
            dynamicData : dynamicData,
            taskId: parameters[2],
        }
        rows.push(info)

        let merkle_root = await create_merkle_datas(dynamicData, leaf_count, leaf_deep);

        let use_sha256 = false;
        let tx = await proof_task.connect(signer).taskEnd(taskId, merkle_root, utils.str_to_w3bytes32(""), use_sha256);
        
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
