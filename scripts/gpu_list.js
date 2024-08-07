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
    let target_token_name = "SCPNSUnitGpu";
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
    let count = await client.countOf();
    logger.debug(count);
    return count;
}

async function show_gpus(client) {
    let count = await client.countOf();
    let ret = [];
    for (var i = 0; i < count; i++) {
        let id =  await client.tokenOfByIndex(i);
        let datas = await client.datasOf(id);
        let meta_data = datas;

        if (datas.startsWith("0x"))
        {
            datas = web3.utils.hexToUtf8(datas);
            logger.debug(JSON.parse(datas));
        }

        data = {
            type: await client.unitType(),
            name: web3.utils.hexToUtf8(await client.nameOf(id)),
            id: utils.w3uint256_to_str(id),
            meta_data: meta_data
        }; 
        ret.push(data);
    }
    logger.table(ret);
}

async function new_token_id() {
    var myDate = new Date();
    return web3.utils.soliditySha3(myDate.toLocaleTimeString());
}
async function run() {
    logger.debug("start working...", "gpu_list");
    for (var token_name in tokens) {
        if (!is_target_name(token_name)) continue;

        logger.debug("#contract name: " + token_name);
        token = tokens[token_name];
        let cobj = await get_contract(token.name, token.address);
        logger.debug("nft address: " + token.address);

        const accounts = await web3.eth.getAccounts();

        let token_id = await new_token_id();
        logger.debug("token_id= " + token_id);


        let utid = utils.str_to_w3uint256(token_id);
        logger.debug("token_id(uint256) = " + utid);

        await show_gpus(cobj);
    }
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
