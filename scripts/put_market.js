
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const gs_abi    = require("./datas/abis/GPUStore.json");
const { users }       = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");

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
    let contracts        = contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let to               = gpu_store.address;
    let market_link      = contracts.SCPNSMarketLink;
    let revenue_token    = contracts.RevenueToken;

    //1.
    // 获取钱包中account, 此account是使用权通证(use_right_id)的拥有者
    let signer = users.seller.signer; 
    let owner = await signer.getAddress();
    // 从配置文件中读取使用权通证(一个算力节点对应一个使用权通证)
    let use_right_id = await select_use_right_id(owner);

    logger.debug("owner: " + owner);
    logger.debug("to: " + to);
    logger.debug("use_right_id: " + use_right_id);

    //检查使用权通证是否已经生成收益权通证
    let cvmId       = await use_right.computilityVMIdOf(use_right_id);
    let token_count = await revenue_token.tokenSupplyInSlot(cvmId);
    //==0 则说明没有创建过
    if (token_count == 0) {
        let revenue_value = await use_right.revenueValueOf(use_right_id);
        let owners = [owner, await users.beneficiary.signer.getAddress()];
        let values = [];
        let last = revenue_value;
        let avg = revenue_value / owners.length;
        for (let i = 0; i < owners.length -1; i++) {
            //注意不能整除的情况
            values.push(avg);
            last -= avg
        }
        values.push(last);

        
        await market_lint.mintRevenue(cvmId, owners, values);
    }



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
