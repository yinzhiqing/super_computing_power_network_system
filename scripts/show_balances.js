const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const gs_abi    = require("./datas/abis/GPUStore.json");
const vnet_abi    = require("./datas/abis/IERC20Upgradeable.json");
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
    logger.debug("start working...", "show balance");

    //获取合约SCPNSProofTask对象
    let use_right        = await utils.contract("SCPNSUseRightToken");
    let dns              = await utils.contract("SCPNSDns");
    let to               = await dns.addressOf("GPUStore");
    let gpu_store        = await utils.contract_ext(gs_abi, to);
    let vnet_token       = await utils.contract_ext(vnet_abi.abi, await gpu_store._paymentToken());
    let users = [0, 19];
    let list  = [];
    for (let i in users) {
        let account = ethers.provider.getSigner(users[i]); 
        list.push({
            account: await account.getAddress(),
            balance: Number(await vnet_token.balanceOf(account.getAddress()))
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
