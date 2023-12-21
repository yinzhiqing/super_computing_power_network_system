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

async function run() {
    logger.info("账户金额");

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let to               = await dns.addressOf("GPUStore");
    let gpu_store        = contracts.GPUStore;
    let vnet_token       = contracts.VNetToken;
    logger.debug("vnet token address: " + vnet_token.address);
    let list  = [];
    let merge_users = {};

    for (let i in users) {
        let account = users[i].signer;
        let addr = await users[i].signer.getAddress();
        merge_users[addr] = (merge_users[addr] == undefined ? "" : merge_users[addr] + ", ") + users[i].alias;
    }
    
    let other_address = [
        {alias: "市场", address: gpu_store.address},
    ]

    for (let i in other_address) {
        let addr = await other_address[i].address;
        merge_users[addr] = (merge_users[addr] == undefined ? "" : merge_users[addr] + ", ") + other_address[i].alias;
    }

    for (let key in merge_users) {
        list.push({
            name: merge_users[key],
            account: key,
            balance: (await vnet_token.balanceOf(key)).toString(),
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
