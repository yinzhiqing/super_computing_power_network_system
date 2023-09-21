
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

function show_tokens(useRightId) {
    let vt = utils.contract("SCPNSVerifyTask");
    logger.debug("start");

    //TaskData(_eventIndex.current(), useRightId, _preBlockNumber, _msgSender(), vp, datas);
    //event TaskData(uint256 indexed index, uint256 indexed useRightId, 
    //               uint256 preBlockNumber,  address sender, VerifyParameter vp, string datas);
    vt.on("TaskData", (index, useRightId, preBlockNumber, sender, vp, datas) => {
        console.log(index);
        console.log(useRightId);
    });
    setTimeout(init, 3000);
}
 
let useRightId = "0xbcf263e964ac2634a5116a72249f9903f4edbcab07e979fcd695ecee7d5bb51d";
show_tokens(useRightId);

