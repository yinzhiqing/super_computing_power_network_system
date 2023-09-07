
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
    let target_token_name = "SCPNSComputilityUnit";
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

    return has;
}

async function count_of(client) {
    let count = await client.totalSupply();
    logger.debug(count);
    return count;
}

async function new_token_id(pre) {
    var date = new Date();
    return web3.utils.soliditySha3(pre + date.toLocaleTimeString());
}

async function contract(name) {
    let token = tokens[name];
    return await get_contract(token.name, token.address);
}
async function run() {
    logger.debug("start working...", "mint");


    let computility_unit = await contract("SCPNSComputilityUnit");
    let type_unit = await contract("SCPNSTypeUnit");

    let role   = "MINTER_ROLE";
    let signer = ethers.provider.getSigner(0); 
    let minter = await signer.getAddress(); 

    let has_miter = await has_role(computility_unit, minter, role);
    if (has_miter != true) {
        logger.error(personal + " no minter role." );
        return;
    } 

    let type_unit_count = await type_unit.totalSupply();

    let to = await signer.getAddress();

    let rows = [];
    for (var i = 0; i < type_unit_count; i++) {
        let type_unit_id = await type_unit.tokenByIndex(i);
        let type_unit_name = utils.w3bytes32_to_str(await type_unit.nameOf(type_unit_id));
        let token_id = await new_token_id(type_unit_name);
        let count = i + 1;

        let datas = utils.json_to_w3str({data: type_unit_name});
        logger.debug("new token: " + token_id);
  
        let tx = await computility_unit.connect(signer).mint(to, token_id,  type_unit_id, count, datas);

        rows.push({
            to: to,
            token_id: token_id,
            type_unit_id: utils.w3uint256_to_hex(type_unit_id),
            type_unit_count: utils.w3uint256_to_str(count),
        })
    }
    logger.table(rows, "new tokens");
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
