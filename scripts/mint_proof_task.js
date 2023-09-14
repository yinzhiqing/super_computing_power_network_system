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

    let use_right = await contract("SCPNSUseRightToken");
    let proof_task      = await contract("SCPNSProofTask");

    let role   = "MINTER_ROLE";
    let signer = ethers.provider.getSigner(0); 
    let minter = await signer.getAddress(); 

    let has_miter = await has_role(proof_task, minter, role);
    if (has_miter != true) {
        logger.error(personal + " no minter role." );
        return;
    } 

    let use_right_count = await use_right.totalSupply();

    let to = await signer.getAddress();

    let rows = [];

    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenByIndex(i));
        let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);

        if (isInProof) {
            logger.info("useRight token(" + use_right_id +") is in proof, next...");
            continue;
        }

        let deadline = await use_right.deadLine(use_right_id);
        let now_utc_time = Math.floor(((new Date()).getTime()));
        logger.info(" check use_right_id(" + use_right_id + "deadline is " + deadline, "now time:" + now_utc_time);

        if (deadline < now_utc_time) {
            logger.debug("use_right_id: " + use_right_id + "is deadline");
            continue;
        }

        let datas = utils.json_to_w3str({data: "test"});
        logger.debug("new task to " + to + " deadline: " + deadline);
        logger.debug("vm id: " + use_right_id);

  
        let tx = await proof_task.connect(signer).mint(to, use_right_id, 
                                utils.str_to_w3bytes32(""), datas);

        rows.push({
            to: to,
            use_right_id: use_right_id
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
