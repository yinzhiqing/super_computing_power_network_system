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

    let computility_vm = await contract("SCPNSComputilityVM");
    let use_right      = await contract("SCPNSUseRightToken");
    let typeUnit       = await contract("SCPNSTypeUnit");

    let role   = "MINTER_ROLE";
    let signer = ethers.provider.getSigner(0); 
    let minter = await signer.getAddress(); 

    let has_miter = await has_role(use_right, minter, role);
    if (has_miter != true) {
        logger.error(personal + " no minter role." );
        return;
    } 

    let computility_vm_count = await computility_vm.totalSupply();

    let to = "0xFbB84C3b36b61356425e8B916D81bB977071BbD0";
    let type = "CPU";
    



    let rows = [];

    for (var i = 0; i < computility_vm_count; i++) {
        let computility_vm_id = utils.w3uint256_to_hex(await computility_vm.tokenByIndex(i));

        let free = await computility_vm.isFree(computility_vm_id);
        if (false == free) {
            logger.warning(computility_vm_id + " is locked. next..");
            continue;
        }

        let typeUnitId = await computility_vm.typeUnitIdOf(computility_vm_id);
        let typeUnitName  = utils.w3bytes32_to_str(await typeUnit.nameOf(typeUnitId));


        let deadline = await computility_vm.deadLine(computility_vm_id);
        let token_id = await new_token_id(computility_vm_id);
        let datas = utils.json_to_w3str({data: "test"});
        logger.debug("new token: " + token_id + " deadline: " + deadline);
        logger.debug("vm id: " + computility_vm_id);

  
        let tx = await use_right.connect(signer).mint(to, token_id,  deadline, 
                    [computility_vm_id], datas);

        rows.push({
            to: to,
            token_id: token_id,
        })
        break;
    }
    logger.table(rows, "new tokens");
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
