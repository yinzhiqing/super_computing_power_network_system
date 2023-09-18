const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const units_cfg     = require("./datas/units.config.js");

const units      = units_cfg.units;
const gpus       = units.gpus;
const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function get_contract(name, address) {
    return await utils.get_contract(name, address);
}

function is_target_name(token_name) {
    let target_token_name = "SCPNSGpuList";
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

async function mint(client, signer, token_id, name, datas) {
    logger.debug("mint from " + await signer.getAddress() + " to with token_id = " + token_id);
    return await client.connect(signer).mint(token_id, name, datas);
}

async function new_token_id() {
    var myDate = new Date();
    return web3.utils.soliditySha3(myDate.toLocaleTimeString());
}

async function run() {
    logger.debug("start working...", "mint");
    for (var token_name in tokens) {
        if (!is_target_name(token_name)) continue;

        logger.debug("#contract name: " + token_name);
        token = tokens[token_name];
        let cobj = await get_contract(token.name, token.address);
        logger.debug("nft address: " + token.address);

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


        await count_of(cobj);
        logger.debug(gpus);
        for (var name in gpus) {
            let token_id = web3.utils.soliditySha3(name);
            logger.debug("token_id= " + token_id);

            let existed = await cobj.exists(token_id);
            if (existed) {
                logger.warning("token is existed. id : " + token_id);
                continue;
            } else {
                logger.info("new token(" + name +"). id : " + token_id);
                logger.debug(gpus[name]);
                logger.debug("--------> toW3str")
                let datas = utils.str_to_w3str(JSON.stringify(gpus[name]));
                logger.debug(datas);
                let tx = await mint(cobj, signer, token_id, utils.str_to_w3bytes32(name), datas);
                logger.table(gpus[name]);
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
