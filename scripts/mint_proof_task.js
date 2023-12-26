const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const {users}            = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let has = await cobj.hasRole(brole, address);

    return has;
}

async function run() {
    logger.debug("start working...", "mint");

    let use_right       = await utils.contract("SCPNSUseRightToken");
    let proof_task      = await utils.contract("SCPNSProofTask");

    let role   = "MINTER_ROLE";
    let signer = users.seller.signer; 
    let receiver = users.prover.signer; 
    let minter = await signer.getAddress(); 

    let has_miter = await has_role(proof_task, minter, role);
    if (has_miter != true) {
        logger.error(personal + " no minter role." );
        return;
    } 

    let from_address = await signer.getAddress();
    let to = await receiver.getAddress();
    let use_right_count = await use_right.balanceOf(from_address);

    let rows = [];
    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenOfOwnerByIndex(from_address, i));

        let isInProof = await proof_task.isInProofOfUseRightId(use_right_id);

        if (isInProof) {
            logger.info("useRight token(" + use_right_id +") is in proof, next...");
            continue;
        }

        let deadline = await use_right.deadLine(use_right_id);
        let now_utc_time = Math.floor(((new Date()).getTime())/1000);
        logger.info(" check use_right_id(" + use_right_id + "deadline is " + deadline, " now time:" + now_utc_time);

        if (deadline < now_utc_time) {
            logger.debug("use_right_id: " + use_right_id + " is deadline");
            continue;
        }

        let datas = utils.json_to_w3str({data: "test"});
        logger.debug("new task to " + to + " deadline: " + deadline);
        logger.debug("vm id: " + use_right_id);
  
        let tx = await proof_task.connect(signer).mint(to, use_right_id, 
                                utils.str_to_w3bytes32(""), datas);

        rows.push({
            to: to.substr(0, 6),
            use_right_id: use_right_id
        })
        break;
    }
    logger.table(rows, "new proof task");
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
