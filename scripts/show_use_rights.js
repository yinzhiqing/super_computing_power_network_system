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
async function show_tokens(token) {
    let cobj     = await utils.contract("SCPNSUseRightToken");
    let typeUnit = await utils.contract("SCPNSTypeUnit");
    let gpu      = await utils.contract("SCPNSGpuList");
    logger.debug("token address: " + cobj.address);

    let name = await cobj.name();
    logger.debug("name: " + name);
    let amounts = await cobj.totalSupply();
    logger.debug("totalSupply: " + amounts);
    let list = [];
    for (let i = 0; i < amounts; i++) {
        let row = new Map();
        row["tokenId"] = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
        row["owner"] = await cobj.ownerOf(row["tokenId"]);
        row["deadline"] = await cobj.deadLine(row["tokenId"]);
        row["deadline"] = (new Date(Number(row["deadline"]))).toLocaleString();

        let datas = utils.w3str_to_str(await cobj.datasOf(row["tokenId"]));

        logger.debug("tokenId: " + row["tokenId"], "token info");
        logger.debug("deadLine:" + row["deadline"]);
        logger.debug(JSON.parse(datas));
        list.push(row);

        let typeUnitCount = utils.w3uint256_to_str(await cobj.typeUnitCountOf(row["tokenId"]));
        let typeUnitId    = await cobj.typeUnitIdOf(row["tokenId"]);
        let typeUnitName  = utils.w3bytes32_to_str(await typeUnit.nameOf(typeUnitId));
        row["model"] = typeUnitName;
        row["unit count"] = typeUnitCount.toString();

        logger.debug("typeUnitId: " + typeUnitId);
        logger.debug("typeUnitCount: " + typeUnitCount);
        logger.debug("typeUnitName:" +  typeUnitName)

        let use_right = {
            "使用权通证ID": row["tokenId"],
            "拥有者": row["owner"],
            "类型":  await typeUnit.unitTypeOf(typeUnitId),
            "型号": typeUnitName,
            "数量": typeUnitCount.toString(),
            "使用截止日期": row["deadline"]
        }

        let unit = await typeUnit.unitIdOf(typeUnitId);
        let unitDatas = await gpu.datasOf(unit);

        let unitInfo = JSON.parse(utils.w3str_to_str(unitDatas));
        unitInfo["name"] = typeUnitName;

        logger.table(use_right,  "token info: " + i);
        logger.table(unitInfo, "型号参数");

        //let gpuDatas = utils.w3str_to_str(await gpu.datasOf(typeId);
    } 
    logger.table(list, "all token");
}

async function get_datas() {
    
}

async function run() {
    logger.debug("start working...", "show_tokens");
    await show_tokens();
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
