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
    return index;
}

// 获取证明值: 路径节点
async function get_proof(leaf, dynamicData, leaf_count, leaf_deep) {
    logger.debug({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep});
    //create merkle
    let proof = merkle.get_proof_by_hash(leaf, dynamicData, leaf_count, leaf_deep);
    logger.debug("proof: " + proof);
    return proof;
}
async function check_use_right_id_need_verify(use_right_id, owner, buf) {
    assert(use_right_id != false, "use_right_id(" + use_right_id + ") is invalid argument.");

    let use_right       = await utils.contract("SCPNSUseRightToken");
    let verify_task     = await utils.contract("SCPNSVerifyTask");
    let proof_task      = await utils.contract("SCPNSProofTask");

    /*
     * 1. 判断使用权通证对应的算力节点是否有挑战任务
     */
    let isInVerify   = await verify_task.isInVerifyOfUseRightId(use_right_id);
    if (!isInVerify) {
        let verify_parameter= await verify_task.verifyParameterOfUseRightId(use_right_id); 
        logger.debug(verify_parameter);
        logger.debug("useRight token(" + use_right_id +") is not in verify, next...");
        return false;
    }

    /*
     * 2. 获取算力使用权通证对应的算力证明参数（此处是确认proofId是否是当前最新的且完成的算力证明任务对应的数据）
     */
    let proof_parameters = await verify_task.proofParametersByUseRightId(use_right_id);
    let proofId     = utils.w3uint256_to_hex(proof_parameters[2]); // 算力证明任务ID
    // 只对自己证明的挑战感兴趣
    let is_owner = await proof_task.isOwner(proofId, owner);
    if (!is_owner) {
        logger.debug("owner of proof task id(" + proofId +") is not signer, next...");
        return false;
    }

    return true;
}
async function select_use_right_id_in_verify(owner, buf, use_right_id = null) {
    let use_right       = await utils.contract("SCPNSUseRightToken");
    let verify_task     = await utils.contract("SCPNSVerifyTask");
    let proof_task      = await utils.contract("SCPNSProofTask");

    let use_right_count = await use_right.totalSupply();

    //使用固定使用权通证
    if(use_right_id != null) {
        logger.debug("use fixed use_right_id: " + use_right_id);
        let valid = await check_use_right_id_need_verify(use_right_id, owner, buf);
        if(valid == true) {
            return use_right_id;
        }
    } else {
        //随机选择一个， 此处可指定固定使用权通证(use_right_id) 
        logger.debug("select use_right_id ");
        for (var i = 0; i < use_right_count; i++) {
            let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
            let valid = await check_use_right_id_need_verify(use_right_id, owner, buf);
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
    logger.debug("fixed user_right_id: " + fixed_use_right_id);

    let use_right       = await utils.contract("SCPNSUseRightToken");
    let verify_task     = await utils.contract("SCPNSVerifyTask");

    let signer          = user.signer; 
    let owner           = await signer.getAddress();

    let rows = [];

    //这里可以指定一个特定的感兴趣的use_right_id
    let use_right_id = await select_use_right_id_in_verify(owner, buf, fixed_use_right_id);
    if (use_right_id == false || use_right_id == "") {
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
        return null;
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
    logger.debug(rows);
    
    return use_right_id;
}

async function create_merkle_datas(dynamicData, leaf_count, leaf_deep) {
    logger.table({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep}, "create merkle tree")
    //create merkle
    let merkle_root = merkle.get_root(dynamicData, leaf_count, leaf_deep);
    logger.info("merkle_root: " + merkle_root);
    return merkle_root;
}
async function check_use_right_id_can_proof(use_right_id) {
    assert(use_right_id != false, "use_right_id(" + use_right_id + ") is invalid argument.");

    let use_right       = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");
    let verify_task     = await utils.contract("SCPNSVerifyTask");
    let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);

    if (isInProof) {
        logger.info("useRight token(" + use_right_id +") is in proof, next...");
        return false;
    }

    let isInVerify = await verify_task.isInVerifyOfUseRightId(use_right_id);
    if (isInVerify) {
        logger.info("useRight token(" + use_right_id +") is in verify, next...");
        return false;
    }

    let pricision_chain = await use_right.pricision();
    let deadline = (await use_right.deadLine(use_right_id)) * pricision_chain;
    let now_utc_time = Math.floor(((new Date()).getTime()));
    logger.debug(" check use_right_id(" + use_right_id + " deadline is " + deadline + ", now time: " + now_utc_time);

    if (deadline < now_utc_time) {
        logger.debug("use_right_id: " + use_right_id + " is deadline");
        return false;
    }

    return true;
}
async function select_use_right_id_can_proof(owner, use_right_id = null) {
    let use_right       = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");
    let use_right_count = await use_right.balanceOf(owner);

    if(use_right_id != null) {
        let valid = await check_use_right_id_can_proof(use_right_id);
        if(valid == true) {
            return use_right_id;
        }
    } else {
        for (var i = 0; i < use_right_count; i++) {
            let use_right_id = utils.w3uint256_to_hex(await use_right.tokenOfOwnerByIndex(owner, i));

            if (await check_use_right_id_can_proof(use_right_id) == false) {
                continue;
            }
            return use_right_id;
        }
    }

    return null;
}

async function check_use_right_id_need_proof(use_right_id, owner, buf) {
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

    let is_owner = await proof_task.isOwner(taskId, owner);
    if (!is_owner) {
        return false;
    }
    return true;
}

async function select_use_right_id_in_proof(owner, buf, fixed_use_right_id = null) {
    //return use_right_id;
    let use_right       = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");
    let use_right_count = await use_right.totalSupply();

    //
    if(fixed_use_right_id != null) {
        let valid = await check_use_right_id_need_proof(fixed_use_right_id, owner, buf);
        if(valid == true) {
            return fixed_use_right_id;
        }
    } else {
        for (var i = 0; i < use_right_count; i++) {
            let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
            let valid = await check_use_right_id_need_proof(use_right_id, owner, buf);
            if(valid == true) {
                return use_right_id;
            }
        }
    }
    return "";
}

async function proof(user, buf, fixed_use_right_id = null) {
    logger.warning("等待算力证明...");
    logger.debug("fixed user_right_id: " + fixed_use_right_id);

    let use_right       = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");

    let signer = user.signer; 
    let owner  = await signer.getAddress();
    logger.debug("signer address: " + owner);

    let rows = []

    let use_right_id = await select_use_right_id_in_proof(owner, buf, fixed_use_right_id);
    if (use_right_id == false || use_right_id == "") {
        logger.debug("not found token in proof");
        return;
    }

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

    let is_owner = await proof_task.isOwner(taskId, owner);
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

    rows.push({
        use_right_id: use_right_id,
        taskId: taskId,
    });


    if (rows.length > 0) {
        logger.table(rows, "证明信息");
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

async function mint_proof(owner, prover, fixed_use_right_id = null) {
    logger.debug("start working...", "mint proof");
    logger.debug("fixed user_right_id: " + fixed_use_right_id);

    let contracts       = await contracts_load();
    let use_right       = contracts.SCPNSUseRightToken;
    let proof_task      = contracts.SCPNSProofTask;
    let verify_task     = contracts.SCPNSVerifyTask;
    let rows = [];

    let role     = "MINTER_ROLE";
    let signer   = owner.signer; 
    let receiver = (prover == undefined ? users.prover : prover).signer; 
    let minter   = await signer.getAddress(); 

    let has_miter = await utils.has_role(proof_task, minter, role);
    if (has_miter != true) {
        logger.error(personal + " no minter role." );
        return;
    } 

    let from_address = await signer.getAddress();
    let to = await receiver.getAddress();

    let use_right_id = await select_use_right_id_can_proof(from_address, fixed_use_right_id);
    if (use_right_id == false || use_right_id == "") {
        logger.debug("没有可以验证的通证");
        return null;
    }

    let datas = utils.json_to_w3str({data: "test"});

    let tx = await proof_task.connect(signer).mint(to, use_right_id, 
        utils.str_to_w3bytes32(""), datas);

    rows.push({
        to: to.substr(0, 6),
        use_right_id: use_right_id
    })
    logger.table(rows, "new mint proof task");
    return use_right_id;
}

module.exports = {
    mint_proof,
    proof,
    verify,
    show_verify_tasks,
}
