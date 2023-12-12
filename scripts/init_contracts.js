
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

async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);

    return has;
}

async function grant_role(cobj, address, role) {
    let has = await has_role(cobj, address, role);
    if (has != true) {
        logger.info("grant role :" +  role + " to " + address + " in " + cobj.address);
        let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
        await cobj.grantRole(brole, address);
    } else {
        logger.info(address + " has the " +  role + " role in " + cobj.address);
    }
}

async function set(client, signer, name, address){
    let has = await has_role(client, await signer.getAddress());
    if (has != true) {
        logger.error(signer_address + " no manager role." );
        return;
    } 

    logger.debug("set dns(name, address): (" + name + " ," + address + ")");
    tx = await client.connect(signer).set(name, address);
    logger.debug(tx);
}

async function run() {
    logger.debug("start working...", "notes");

    let computility_unit = await contract("SCPNSComputilityUnit");
    let computility_vm   = await contract("SCPNSComputilityVM");
    let computility_rank = await contract("SCPNSComputilityRanking");
    let use_right        = await contract("SCPNSUseRightToken");
    let proof_task       = await contract("SCPNSProofTask");
    let verify_task      = await contract("SCPNSVerifyTask");

    const accounts = await web3.eth.getAccounts();
    let signer = users.manager.signer; 

    // grant manager role to SCPNSComputilityVM
    //               contract           roler                   role
    await grant_role(computility_unit,  computility_vm.address, "MANAGER_ROLE");
    await grant_role(computility_vm,    use_right.address,      "CONTROLLER_ROLE");
    await grant_role(computility_rank,  proof_task.address,     "CONTROLLER_ROLE");
    await grant_role(verify_task,       proof_task.address,     "CONTROLLER_ROLE");
    //￼0x7B5dE13ff540C685eBA05b34A5283fAF02A1Bb88
    await grant_role(use_right,  '0x7B5dE13ff540C685eBA05b34A5283fAF02A1Bb88',     "MINTER_ROLE");

    //

    tx = await verify_task.connect(signer).updateWaitBlockNumber(100);
}


run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });

