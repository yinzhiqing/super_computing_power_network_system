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


async function run() {
    logger.debug("start working...", "show mark");

    //获取合约SCPNSProofTask对象
    let use_right        = await utils.contract("SCPNSUseRightToken");
    let dns              = await utils.contract("SCPNSDns");
    let to               = await dns.addressOf("GPUStore");
    let gpu_store        = await utils.contract_ext(gs_abi, to);

    let orders = await gpu_store.getOrderIds();
    logger.debug(orders);

    let saleIds = await gpu_store.getGPUTokenForSaleIds();
    let list = []
    for (let i in saleIds) {
        logger.debug(utils.w3uint256_to_hex(saleIds[i]));
        let gpu_sale_info = await gpu_store._gpuTokenStore(saleIds[i]);
        list.push({
            use_right_id: utils.w3uint256_to_hex(gpu_sale_info[0]),
            owner: gpu_sale_info[3],
        })
    }
    logger.table(list);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
