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

async function select_use_right_id() {
    let use_right = await contract("SCPNSUseRightToken");
    let use_right_count = await use_right.totalSupply();
    let verify_task      = await contract("SCPNSVerifyTask");

    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
        logger.debug("use_right_id: " + use_right_id);

        let deadline = await use_right.deadLine(use_right_id);
        let now_utc_time = Math.floor((new Date()).getTime());

        if (deadline < now_utc_time) {
            continue;
        }

        let canVerify = await verify_task.canVerifyOfUseRightId(use_right_id);
        if (canVerify) {
            return use_right_id;
        }
    }
    throw "没有发现可用使用权通证";
}

async function create_q(dynamicData, leaf_count, leaf_deep) {
    leaf_count = leaf_count % 1024;
    leaf_deep  = leaf_deep % 100;

    logger.table({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep}, "create merkly tree")
    //create merkly
    //test root 
    let leaf = merkly.get_leaf(leaf_count/2, dynamicData, leaf_count, leaf_deep);
    logger.info("leaf : " + leaf);
    return leaf;
}

async function run() {
    logger.debug("start working...", "mint");

    //获取合约SCPNSVerifyTask对象
    let verify_task      = await contract("SCPNSVerifyTask");

    //1.
    // 获取钱包中account, 此account是使用权通证(use_right_id)的拥有者
    let signer = ethers.provider.getSigner(0); 
    // 从配置文件中读取使用权通证(一个算力节点对应一个使用权通证)
    let use_right_id = await select_use_right_id();

    //2.
    //一个算力节点只能存在一个未完成的证明任务，
    //判断指定的算力节点是否存在没有完成的证明任务，
    //如果存在则不能开启新的任务
    let canVerify = await verify_task.canVerifyOfUseRightId(use_right_id);
    if (!canVerify) {
        logger.info("useRight token(" + use_right_id +") is can't verify, next...");
        return ;
    }

    //3.
    let parameters = await verify_task.proofParametersByUseRightId(use_right_id);
    let dynamicData = utils.w3uint256_to_hex(parameters[0]);
    let parameter   = JSON.parse(utils.w3str_to_str(parameters[1]));
    let leaf_count  = parameter["leaf_count"];
    let leaf_deep   = parameter["leaf_deep"];
    let proofId      = utils.w3uint256_to_hex(parameters[2]);

    let q = await create_q(dynamicData, leaf_count, leaf_deep);

    // 附加数据 json 格式字符串形式
    let datas = web3.eth.abi.encodeParameter("string", JSON.stringify({data: "test"}));


    //算力使用权用户signer发起一个证明任务给指定的算力节点（use_right_id）
    let tx = await verify_task.connect(signer).mint(use_right_id, proofId, q, datas);

    let info = {
        use_right_id: use_right_id,
        proofId: proofId,
        q: q
    };
    logger.table(info, "new verify task");
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
