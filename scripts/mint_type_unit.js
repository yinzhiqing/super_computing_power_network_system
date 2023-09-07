
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

function is_target_name(token_name) {
    let target_token_name = "SCPNSTypeUnit";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

async function show_accounts() {
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);
}

async function conv_type_id(id) {
    return web3.utils.soliditySha3(utils.str_to_w3uint256(id));
}
async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);
    logger.info(address + " check role(" + role + ") state: " + has);

    return has;
}

async function count_of(client) {
    let count = await client.totalSupply();
    logger.debug(count);
    return count;
}

async function mint(client, signer, token_id, name, unitAddr, unitId, datas) {
    logger.debug("mint from " + await signer.getAddress() + " to with token_id = " + token_id);
    return await client.connect(signer).mint(token_id, name, unitAddr, unitAddr, datas);
}

async function new_token_id() {
    var myDate = new Date();
    return web3.utils.soliditySha3(myDate.toLocaleTimeString());
}

async function run() {
    logger.debug("start working...", "mint");

    let gpu_token = tokens["SCPNSGpuList"];
    let gpu_cobj = await get_contract(gpu_token.name, gpu_token.address);
    let gpu_addr = gpu_token.address;


    for (var token_name in tokens) {
        if (!is_target_name(token_name)) continue;

        logger.debug("#contract name: " + token_name);
        token = tokens[token_name];
        let cobj = await get_contract(token.name, token.address);

        const accounts = await web3.eth.getAccounts();
        let role = "MINTER_ROLE";
        let signer = ethers.provider.getSigner(0); 
        let minter = await signer.getAddress(); 
        logger.debug("minter = " + minter);

        let has_miter = await has_role(cobj, minter, role);
        if (has_miter != true) {
            logger.error(personal + " no minter role." );
            return;
        } 

        //append unitType address to 
        if (! await cobj.isValidUnitType(gpu_addr)) {
            logger.warning("add unit type: " + gpu_addr);
            await cobj.connect(signer).addUnitType(gpu_addr);
            await cobj.isValidUnitType(gpu_addr);

        }

        let gpu_count = await gpu_cobj.totalSupply();

        for (var i = 0; i < gpu_count; i++) {
            let token_id = await gpu_cobj.tokenByIndex(i);
            let token_name = await gpu_cobj.nameOf(token_id);

            let existed = await cobj.exists(token_id);
            if (existed) {
                logger.warning("token is existed. id : " + token_id);
                continue;
            } else {
                logger.info("new token. id : " + token_id);
                let datas = utils.str_to_w3str(JSON.stringify({data:"test"}));
                let tx = await mint(cobj, signer, token_id, token_name, gpu_addr, token_id, datas);
                logger.debug(tx);
            }
        }
    }
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
