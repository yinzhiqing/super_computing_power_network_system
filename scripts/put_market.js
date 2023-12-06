
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);

    return has;
}

async function select_use_right_id(signer_address) {
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

        let parameters  = await proof_task.latestParametersByUseRightId(use_right_id); 
        let taskId      = utils.w3uint256_to_hex(parameters[2]);

        let is_owner = await proof_task.isOwner(taskId, signer_address);
        if (!is_owner) {
            logger.info(" owner of proof task id(" + taskId +") is not signer, next...");
            continue;
        }

        return use_right_id;
    }
    return "";

}

async function run() {
    logger.debug("start working...", "put mark");

    //获取合约SCPNSProofTask对象
    let use_right       = await utils.contract("SCPNSUseRightToken");
    let market_link      = await utils.contract("SCPNSMarketLink");
    let dns              = await utils.contract("SCPNSDns");

    //1.
    // 获取钱包中account, 此account是使用权通证(use_right_id)的拥有者
    let signer = ethers.provider.getSigner(0); 
    let owner = await signer.getAddress();
    // 从配置文件中读取使用权通证(一个算力节点对应一个使用权通证)
    let use_right_id = await select_use_right_id(owner);

    //3.
    //设置上传证明结果(merkly-tree 根)时操作的账号地址
    //（只有to账号和算力使用权所有者能够上传证明结果）
    let to    = await dns.addressOf("SCPNSMarketLink");

    //算力使用权用户signer发起一个证明任务给指定的算力节点（use_right_id）
    await use_right.connect(signer).approve(to, use_right_id);
    logger.debug(use_right_id);

    let isApproved = await use_right.connect(signer).isApproved(owner, to);
    while(isApproved == false) {
        isApproved = await use_right.connect(signer).isApproved(owner, to);
    }

    //算力使用权用户signer发起一个证明任务给指定的算力节点（use_right_id）
    await market_link.connect(signer).putToMarket(use_right_id, 10);

    let info = {
        owner: to,
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
