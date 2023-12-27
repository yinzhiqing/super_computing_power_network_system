const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function works(latest_count) {
    let cobj = await utils.contract("SCPNSVerifyTask");
    logger.debug("token address: " + cobj.address);

    let name = await cobj.name();
    logger.debug("name: " + name);

    let amounts = await cobj.totalSupply();
    logger.debug("totalSupply: " + amounts);
    let list = [];
    let detail = {};
    let detail_of = {};

    let start = utils.min_from_right(amounts, latest_count);
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

        let verify_stat_of = await cobj.verifyStatOf(row["tokenId"]);
        logger.debug(">> verify stat of: [t, s, f] " + verify_stat_of);

        let use_right_id_sub = (row["use_right_id"].toString()).substr(0, 6);

        detail[use_right_id_sub] = "verify [t, s, f]  " + verify_stat;
        detail[use_right_id_sub] = {
            total: Number(verify_stat[0].toString()),
            succees: Number(verify_stat[1].toString()),
            failed: Number(verify_stat[2].toString()),
        };

        detail_of[row["tokenId"]] = "verify [t, s, f]  " + verify_stat_of;
        detail_of[row["tokenId"]] = {
            use_right_id: use_right_id_sub,
            total: Number(verify_stat_of[0].toString()),
            succees: Number(verify_stat_of[1].toString()),
            failed: Number(verify_stat_of[2].toString()),
            residue_verify: residue_verify,
            isVerified: await cobj.isVerified(row["tokenId"])
        };

        //reset key-value
        row["use_right_id"] = use_right_id_sub;

        list.push(row);

    } 
    logger.table(detail, "使用权通证证明统计");
    logger.table(detail_of, "使用权通证挑战任务信息 "); 
    logger.table(list, "使用权通证挑战状态信息");
}

module.exports = {
    works,
}
