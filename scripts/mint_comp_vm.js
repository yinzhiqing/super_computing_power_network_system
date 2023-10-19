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

async function new_token_id(pre) {
    var date = new Date();
    return web3.utils.sha3(pre + date.getTime().toString());
}

async function contract(name) {
    let token = tokens[name];
    return await get_contract(token.name, token.address);
}
async function run() {
    logger.debug("start working...", "mint");

    let computility_unit = await contract("SCPNSComputilityUnit");
    let computility_vm   = await contract("SCPNSComputilityVM");

    let role   = "MINTER_ROLE";
    let signer = ethers.provider.getSigner(0); 
    let minter = await signer.getAddress(); 

    let has_miter = await has_role(computility_vm, minter, role);
    if (has_miter != true) {
        logger.error(personal + " no minter role." );
        return;
    } 

    let computility_unit_count = await computility_unit.totalSupply();

    let to = await signer.getAddress();
    let deadline = Math.floor(((new Date()).getTime() )) + 315360000000;

    let rows = [];

    for (var i = 0; i < computility_unit_count; i++) {
        let computility_unit_id = utils.w3uint256_to_hex(await computility_unit.tokenByIndex(i));
        let count = 1;

        let leaveCount = await computility_unit.leaveCountOf(computility_unit_id);
        if (leaveCount < count) {
            logger.debug("resources(" + computility_unit_id +")  cannot meet demand in SCPNSComputilityUnit");
            continue;
        }

        let token_id = await new_token_id(computility_unit_id);
        let datas = utils.json_to_w3str({data: "test"});
        logger.debug("new token: " + token_id + " deadline: " + deadline);
  
        let tx = await computility_vm.connect(signer).mint(to, token_id,  deadline, 
                    [computility_unit_id], [count], datas);

        rows.push({
            to: to,
            token_id: token_id,
            typeUnitCount: count,
            leaveCount: leaveCount - count,
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
