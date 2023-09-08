
// scripts/deploy_upgrade.js
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function get_contract(name, address) {
    return await utils.get_contract(name, address);
}

async function contract(name) {
    let token = tokens[name];
    return await get_contract(token.name, token.address);
}

function is_dns(token_name) {
    let target_token_name = "AssemblyDNS";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

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
    let use_right        = await contract("SCPNSUseRightToken");

    const accounts = await web3.eth.getAccounts();
    let signer = ethers.provider.getSigner(0); 

    // grant manager role to SCPNSComputilityVM
    await grant_role(computility_unit, computility_vm.address, "MANAGER_ROLE");
    await grant_role(computility_vm, use_right.address, "CONTROLLER_ROLE");
}


run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });

