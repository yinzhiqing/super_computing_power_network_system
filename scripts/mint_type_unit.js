
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

async function conv_type_id(id) {
    return web3.utils.soliditySha3(utils.str_to_w3uint256(id));
}
async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);
    logger.debug(address + " check role(" + role + ") state: " + has);

    return has;
}

async function mint(client, signer, token_id, name, unitAddr, unitId, datas) {
    logger.debug("mint from " + await signer.getAddress() + " to with token_id = " + token_id);
    return await client.connect(signer).mint(token_id, name, unitAddr, unitId, datas);
}

async function new_token_id() {
    var myDate = new Date();
    return web3.utils.soliditySha3(myDate.toLocaleTimeString());
}

async function run() {
    logger.debug("start working...", "mint type unit");

    let gpu_cobj = await utils.contract("SCPNSGpuList");
    let gpu_addr = gpu_cobj.address;
    let cobj = await utils.contract("SCPNSTypeUnit");

    let role = "MINTER_ROLE";
    let signer = users.manager.signer; 
    let minter = await signer.getAddress(); 
    logger.debug("minter = " + minter);

    let has_miter = await has_role(cobj, minter, role);
    if (has_miter != true) {
        logger.error(personal + " no minter role." );
        return;
    } 

    //append unitType address to 
    
    if (! await cobj.isValidUnitType(gpu_addr)) {
        logger.info("add unit type: " + gpu_addr);
        await cobj.connect(signer).addUnitType(gpu_addr);
        await cobj.isValidUnitType(gpu_addr);
    }

    let gpu_count = await gpu_cobj.totalSupply();

    let gpus = [];
    for (var i = 0; i < gpu_count; i++) {
        let type_info = {};
        let token_id = await gpu_cobj.tokenByIndex(i);
        let token_name = await gpu_cobj.nameOf(token_id);
        type_info = {
            token_id: utils.w3uint256_to_hex(token_id.toString()),
            token_name: utils.w3bytes32_to_str(token_name),
            gpu_id: "=token_id",
            new_token: false
        }

        let existed = await cobj.exists(token_id);
        if (existed) {
            logger.debug("token (" + utils.w3bytes32_to_str(token_name ) + ") is existed. id : " + utils.w3uint256_to_hex(token_id));
            gpus.push(type_info);
            continue;
        } else {
            logger.info("new token. id : " + token_id);
            let datas = utils.str_to_w3str(JSON.stringify({data:"test"}));
            let tx = await mint(cobj, signer, token_id, token_name, gpu_addr, token_id, datas);
            logger.debug(tx);
            type_info["new_token"] = true;
            gpus.push(type_info);
        }
    }
    logger.table(gpus);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
