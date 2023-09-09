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

async function show_accounts() {
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);
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

async function create_token_id(data) {
    return web3.utils.sha3(data.toString());
}

async function contract(name) {
    let token = tokens[name];
    return await get_contract(token.name, token.address);
}
async function run() {
    logger.debug("start working...", "mint");

    let proof_parameter = await contract("SCPNSProofParameter");

    let role   = "MINTER_ROLE";
    let signer = ethers.provider.getSigner(0); 
    let minter = await signer.getAddress(); 

    let has_miter = await has_role(proof_parameter, minter, role);
    if (has_miter != true) {
        logger.error(personal + " no minter role." );
        return;
    } 


    let rows = [];
    let token_ids = [];

    let tokens = {
        min: {leaf_count: 100000000,       leaf_deep: 1000000},
        mid: {leaf_count: 10000000000,     leaf_deep: 100000000},
        max: {leaf_count: 10000000000000,  leaf_deep: 10000000000}
    }

    for (var key in tokens) {
        let token = tokens[key];
        let token_id = await create_token_id(key);
        let token_name = key;

        token_ids.push(token_id);

        let isExists = await proof_parameter.exists(token_id); 
        if (isExists == true) {
            logger.debug("token(id = " + token_id +" name =" + token_name + ") is exists");
            continue;
        }

        token_name = utils.str_to_w3bytes32(token_name);
        let parameter = utils.json_to_w3str(token);
        let datas = utils.json_to_w3str({data: key});
        logger.debug("new token: " + token_id);
  
        let tx = await proof_parameter.connect(signer).mint(token_id, token_name, parameter, datas);

        rows.push({
            token_id: token_id,
            token_name: key,
            parameter: utils.json_to_str(token)
        });
    }
    logger.table(rows, "new tokens");

}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
