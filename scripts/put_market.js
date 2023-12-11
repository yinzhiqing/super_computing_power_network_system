
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const gs_abi    = require("./datas/abis/GPUStore.json");

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
    let use_right_count = await use_right.balanceOf(signer_address);
    let skeep = [''];

    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenOfOwnerByIndex(signer_address, i));

        if (skeep.includes(use_right_id)) {
            continue;
        }

        return use_right_id;
    }
    throw("没有 use_right_id");

}

async function run() {
    logger.debug("start working...", "put mark");

    //获取合约SCPNSProofTask对象
    let use_right        = await utils.contract("SCPNSUseRightToken");
    let dns              = await utils.contract("SCPNSDns");
    let to               = await dns.addressOf("GPUStore");
    let gpu_store        = await utils.contract_ext(gs_abi, to);

    //1.
    // 获取钱包中account, 此account是使用权通证(use_right_id)的拥有者
    let signer = ethers.provider.getSigner(0); 
    let owner = await signer.getAddress();
    // 从配置文件中读取使用权通证(一个算力节点对应一个使用权通证)
    let use_right_id = await select_use_right_id(owner);

    logger.debug("to: " + to);
    logger.debug("use_right_id: " + use_right_id);

    //算力使用权用户signer发起一个证明任务给指定的算力节点（use_right_id）


    let addr0 = "0x0000000000000000000000000000000000000000";
    let approved = await use_right.connect(signer).getApproved(use_right_id);
    logger.debug("pre call approved: " + approved);

    if (approved != to) {
        //set to addr0
        /*
        await use_right.connect(signer).approve(addr0, use_right_id);
        while(approved != addr0) {
            approved = await use_right.connect(signer).getApproved(use_right_id);
        }
        */

        await use_right.connect(signer).approve(to, use_right_id);
        while(approved != to) {
            approved = await use_right.connect(signer).getApproved(use_right_id);
        }
    }

    //算力使用权用户signer发起一个证明任务给指定的算力节点（use_right_id）
    await gpu_store.connect(signer).addGpuTokenToStore(use_right_id, 10000);

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
