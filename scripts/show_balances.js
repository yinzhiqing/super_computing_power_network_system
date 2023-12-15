const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const gs_abi    = require("./datas/abis/GPUStore.json");
const vnet_abi    = require("./datas/abis/IERC20Upgradeable.json");
const sur       = require("./show_use_rights_base.js");
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

async function run() {
    logger.debug("start working...", "show balance");

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let to               = await dns.addressOf("GPUStore");
    logger.info("to: " + to);
    let gpu_store        = contracts.GPUStore;
    let vnet_token       = contracts.VNetToken;
    let list  = [];
    for (let i in users) {
        let account = users[i].signer; 
        list.push({
            name: users[i].alias,
            account: await account.getAddress(),
            balance: Number(await vnet_token.balanceOf(account.getAddress()))
        })

    }
    
    let other_address = [
        {alias: "市场", address: gpu_store.address},
    ]

    for(let key in other_address) {
        list.push({
            name: other_address[key].alias,
            account: other_address[key].address,
            balance: Number(await vnet_token.balanceOf(other_address[key].address))
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
