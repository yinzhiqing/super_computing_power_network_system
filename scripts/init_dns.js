// scripts/deploy_upgrade.js
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { users }       = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function has_role(client, address) {
    let role= await client.MANAGER_ROLE();
    let has = await client.hasRole(role, address);
    logger.debug(address + " check role(" + role + ") state: " + has);

    return has;
}

async function set(client, signer, name, address){
    let has = await has_role(client, await signer.getAddress());
    if (has != true) {
        logger.error(signer_address + " no manager role." );
        return;
    } 

    logger.info("set dns(name, address): (" + name + " ," + address + ")");
    tx = await client.connect(signer).set(name, address);
    logger.debug(tx);
}

async function run() {
    logger.debug("start working...", "notes");

    let cobj = await utils.contract("SCPNSDns");

    let role = 0x00; //"DEFAULT_ADMIN_ROLE";
    let signer = users.manager.signer; 

    extends_token = [];
    extends_token.push({"name": "", "address":""});
    for(let token_name in tokens) {
        token = tokens[token_name];
        await set(cobj, signer, token.name, token.address);
        extends_token.push({"name": token.name, "address":token.address});
    }

    let thd_contracts = [
        {
            name: "GPUStore",
            address: "0x04d582f07977Bcb9cBA3Df50ACb44916C7c0Fe70",
        }
    ]

    for (let key in thd_contracts) {
        let token = thd_contracts[key];
        await set(cobj, signer, token.name, token.address);
        extends_token.push({"name": token.name, "address":token.address});
        logger.table(extends_token);
    }
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });

