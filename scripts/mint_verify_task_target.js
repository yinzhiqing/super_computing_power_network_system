const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle    = require("./merkle");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function get_contract(name, address) {
    return await utils.get_contract(name, address);
}

async function contract(name) {
    let token = tokens[name];
    return await get_contract(token.name, token.address);
}

//选择一个使用权通证
async function select_use_right_id(user) {
    let use_right = await contract("SCPNSUseRightToken");

    let owner_count = await use_right.balanceOf(user);
    if (owner_count == 0) {
        throw "没有发现可用使用权通证";
    }
    let use_right_id = await use_right.tokenOfOwnerByIndex(user, owner_count - 1);
    return utils.w3uint256_to_hex(use_right_id);
}

// 随机选择一个叶子对应的数据值hash
async function create_q(dynamic_data, leaf_count, leaf_deep, use_sha256) {
    logger.table({dynamic_data: dynamic_data, leaf_count: leaf_count, leaf_deep: leaf_deep}, "select leaf")
    let leaf_index = 512;
    if (use_sha256) {
        return utils.create_leaf_hash(dynamic_data, leaf_index, leaf_deep);
    } else {
        return merkle.create_leaf_hash(dynamic_data, leaf_index, leaf_deep);
    }
}

/*
 * 此函数描述了挑战者发起挑战的代码调用过程.
 *
 * 挑战者对可以接受挑战的算力节点发起挑战，
 * 挑战方式是给定算力节点一个叶子hash值，
 * 在有限的时间内，
 * 被挑战（算力节点）者需要回答叶子hash对应的路径
 *
 */
async function run() {
    logger.debug("start working...", "mint");

    //获取合约SCPNSVerifyTask对象
    let verify_task      = await contract("SCPNSVerifyTask");
    let proof_task       = await contract("SCPNSProofTask");

    //1. 挑战者
    // 获取钱包中account, 此account是使用权通证(use_right_id)的拥有者
    let signer = ethers.provider.getSigner(0); 
    // 从配置文件中读取使用权通证(一个算力节点对应一个使用权通证)

    let user = "0xFbB84C3b36b61356425e8B916D81bB977071BbD0";
    let use_right_id = await select_use_right_id(user);

    //2.
    /*确认当前使用权通证是否能够进行挑战,需要满足两个条件
     *
     * 1. 有算力证明数据
     * 2. 当前不是算力证明执行执行中状态
     * 3. 当前不是算力验证执行中状态
    */
    let canVerify = await verify_task.canVerifyOfUseRightId(use_right_id);
    if (!canVerify) {
        logger.info("useRight token(" + use_right_id +") is can't verify, next...");
        return ;
    }

    //3. 获取当前使用权通证对应的最新算力证明参数，根据算力证明参数随机选择叶子节点hash作为挑战参数
    let parameters = await verify_task.proofParametersByUseRightId(use_right_id);
    logger.debug(parameters);
    let dynamic_data = utils.w3uint256_to_hex(parameters[0]);
    let parameter   = JSON.parse(utils.w3str_to_str(parameters[1]));
    let leaf_count  = parameter["leaf_count"];
    let leaf_deep   = parameter["leaf_deep"];
    let proofId      = utils.w3uint256_to_hex(parameters[2]);

    logger.debug("proofId;" + proofId);

    //4. 生成挑战问题(叶子hash)
    let use_sha256 = await proof_task.useSha256Of(proofId);
    logger.info("use sha256: ", use_sha256);
    let q = await create_q(dynamic_data, leaf_count, leaf_deep, use_sha256);

    // 附加数据 json 格式字符串形式
    let datas = web3.eth.abi.encodeParameter("string", JSON.stringify({data: "test"}));

    //5. 发起挑战（验证请求）
    //算力使用权用户signer发起一个任务给指定的算力节点（use_right_id）

    let tx = await verify_task.connect(signer).mint(use_right_id, proofId, q, datas);

    let info = {
        use_right_id: use_right_id,
        proofId: proofId.toString(),
        q: q.toString(),
    };
    logger.table(info, "new verify task");
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });