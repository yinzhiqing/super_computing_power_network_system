const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const gs_abi    = require("./datas/abis/GPUStore.json");
const {abi}     = require("./datas/abis/IERC20Upgradeable.json");
const erc20_abi = abi;

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
    let vnet_token       = await utils.contract_ext(erc20_abi, await gpu_store._paymentToken());
    logger.debug("store address: " + gpu_store.address);
    logger.debug("vnet token address: " + vnet_token.address);

    let signer = ethers.provider.getSigner(19); 
    let buyer = await signer.getAddress();
    logger.debug("buyer: " + buyer);

    let orders = await gpu_store.getOrderIds();
    logger.debug("orders: " + orders);

    let saleIds = await gpu_store.getGPUTokenForSaleIds();
    let list = [];
    for (let i in saleIds) {
        logger.debug("use_right_id: " + utils.w3uint256_to_hex(saleIds[i]));
        let gpu_sale_info = await gpu_store._gpuTokenStore(saleIds[i]);
        let use_right_id  = utils.w3uint256_to_hex(gpu_sale_info[0]);
        let price         = Number(gpu_sale_info[2]);

        logger.debug(gpu_sale_info);
        list.push({
            use_right_id: use_right_id,
            price: price,
            seller: gpu_sale_info[3],
            buyer: buyer
        });

        let approved = await vnet_token.connect(signer).allowance(buyer, gpu_store.address);
        logger.debug("allowance token: " + approved);
        await vnet_token.connect(signer).approve(gpu_store.address, price);
        await gpu_store.connect(signer).tradeGPUToken(use_right_id);

        //only remove first
        break;
        
    }
    logger.table(list);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
