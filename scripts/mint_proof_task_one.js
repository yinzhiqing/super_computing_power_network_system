const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

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

async function select_use_right_id() {
    let use_right = await contract("SCPNSUseRightToken");
    let use_right_count = await use_right.totalSupply();
    let proof_task      = await contract("SCPNSProofTask");

    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
        logger.debug("use_right_id: " + use_right_id);

        let deadline = await use_right.deadLine(use_right_id);
        let now_utc_time = Math.floor(((new Date()).getTime()) / 1000);

        if (deadline < now_utc_time) {
            continue;
        }

        let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);
        if (isInProof) {
            continue;
        }
        return use_right_id;
    }
    throw "没有发现可用使用权通证";
}

async function run() {
    logger.debug("start working...", "mint");

    //获取合约SCPNSProofTask对象
    let proof_task      = await contract("SCPNSProofTask");

    //1.
    // 获取钱包中account, 此account是使用权通证(use_right_id)的拥有者
    let signer = ethers.provider.getSigner(0); 
    // 从配置文件中读取使用权通证(一个算力节点对应一个使用权通证)
    let use_right_id = await select_use_right_id();

    //2.
    //一个算力节点只能存在一个未完成的证明任务，
    //判断指定的算力节点是否存在没有完成的证明任务，
    //如果存在则不能开启新的任务
    let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);
    if (isInProof) {
        logger.info("useRight token(" + use_right_id +") is in proof, next...");
        return ;
    }

    //3.
    //设置上传证明结果(merkly-tree 根)时操作的账号地址
    //（只有to账号和算力使用权所有者能够上传证明结果）
    let to = await signer.getAddress();
    //安全验证数据，此处先设置固定值。 后期是 一个数的hash值
    let q = web3.eth.abi.encodeParameter("bytes32", web3.utils.toHex(""));
    // 附加数据 json 格式字符串形式
    let datas = web3.eth.abi.encodeParameter("string", JSON.stringify({data: "test"}));


    //算力使用权用户signer发起一个证明任务给指定的算力节点（use_right_id）
    let tx = await proof_task.connect(signer).mint(to, use_right_id, q, datas);

    let info = {
        to: to,
        use_right_id: use_right_id
    };
    logger.table(info, "new proof task");
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
