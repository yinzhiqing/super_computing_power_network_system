const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const gs_abi    = require("./datas/abis/GPUStore.json");
const sur       = require("./show_use_rights_base.js");

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
    logger.log("market address: " + to);
    logger.log("vnet   address: " + await gpu_store._paymentToken());
    logger.log("");

    let orders = await gpu_store.getOrderIds();

    let saleIds = await gpu_store.getGPUTokenForSaleIds();
    let list = []
    for (let i in saleIds) {
        let gpu_sale_info = await gpu_store._gpuTokenStore(saleIds[i]);

        let use_right_id = utils.w3uint256_to_hex(gpu_sale_info[0]);
        let type_unit_id = await sur.type_unit_id_of(use_right_id);
        let rights = await sur.datas_from_token_id(use_right_id);
        let use_right_info = rights["use_right"];
        logger.log("==========================================================================================================");
        logger.log("\t\t\t\t\t\t使用权通证市场信息表");
        logger.log("----------------------------------------------------------------------------------------------------------");
        for(var k in use_right_info) {
            if (k.length >= 6) {
                logger.log(k + "\t\t\t" + use_right_info[k].toString());
            } else {
                logger.log(k + "\t\t\t\t" + use_right_info[k].toString());
            }
        }
        logger.log("----------------------------------------------------------------------------------------------------------");
        logger.log("挂单者：\t\t\t" + gpu_sale_info[3]);
        logger.log("价格(VNET Token)：\t\t" + Number(gpu_sale_info[2]));
        logger.log("==========================================================================================================");

        list.push({
            use_right_id: utils.w3uint256_to_hex(gpu_sale_info[0]),
            price: Number(gpu_sale_info[2]),
        })

        logger.log("\t");
    }
    logger.table(list);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
