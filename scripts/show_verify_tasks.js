const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function show_tokens() {
    let cobj = await utils.contract("SCPNSVerifyTask");
    logger.debug("token address: " + cobj.address);

    let name = await cobj.name();
    logger.debug("name: " + name);

    let data = "0x0dd9fe0e2c33052886b7e30285180c63b44900f60f94f65c24bd29c6f40f377d0000000000000000000000000000000000000000000000000000000000000200";
    let hshData = await cobj.sha256Of(data);
    logger.warning(hshData);

    let amounts = await cobj.totalSupply();
    logger.debug("totalSupply: " + amounts);
    let list = [];
    let detail = {};

    let start = utils.min_from_right(amounts, 5);
    for (let i = start; i < amounts; i++) {
        let row = new Map();
        row["tokenId"] = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
        row["owner"] = utils.w3uint256_to_hex(await cobj.ownerOf(row["tokenId"]));
        logger.debug(">> tokenId; "     + row["tokenId"], "verify info");
        row["use_right_id"] = utils.w3uint256_to_hex(await cobj.useRightIdOf(row["tokenId"]));
        row["isInVerify"] = await cobj.isInVerifyOf(row["tokenId"]);
        logger.debug(">> isInVerify; "     + row["isInVerify"]);

        let parameters = await cobj.verifyParameterOf(row["tokenId"]);
        logger.debug(">> useRightId: "  + utils.w3uint256_to_hex(parameters[0]));

        logger.debug(">> q: "    + parameters[1]);
        logger.debug(">> state :" + parameters[2].toString());

        let residue_verify = Number(await cobj.residueVerifyOf(row["tokenId"]));
        logger.debug(">> residue Verify: " + residue_verify);

        let verify_stat = await cobj.verifyStatOfUseRightId(row["use_right_id"]);
        logger.debug(">> verify stat: [t, s, f] " + verify_stat);

        detail[row["use_right_id"]] = "verify [t, s, f]  " + verify_stat;
        detail[row["use_right_id"]] = {
            total: Number(verify_stat[0].toString()),
            succees: Number(verify_stat[1].toString()),
            failed: Number(verify_stat[2].toString()),
            residue_verify: residue_verify
        };

        list.push(row);

    } 
    logger.table(detail, "token verify");
    logger.table(list);
}

async function run() {
        logger.debug("show verify tasks");
        await show_tokens();
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

