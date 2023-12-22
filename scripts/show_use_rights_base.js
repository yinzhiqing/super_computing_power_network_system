const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function type_unit_id_of(tokenId) {
    let cobj     = await utils.contract("SCPNSUseRightToken");
    let typeUnitId    = await cobj.typeUnitIdOf(tokenId);
    return typeUnitId;
}

async function datas_from_token_id(tokenId) {
    let cobj     = await utils.contract("SCPNSUseRightToken");
    let typeUnit = await utils.contract("SCPNSTypeUnit");
    let gpu      = await utils.contract("SCPNSGpuList");

    let row = new Map();
    row["tokenId"] = utils.w3uint256_to_hex(tokenId);
    row["cvmId"] = utils.w3uint256_to_hex(await cobj.computilityVMIdOf(row["tokenId"]));
    row["owner"] = await cobj.ownerOf(row["tokenId"]);
    row["revenueValue"] = Number(await cobj.revenueValueOf(row["tokenId"]));
    //logger.log(row["revenueValue"]);
    row["deadline"] = await cobj.deadLine(row["tokenId"]);
    let pricision_chain = await cobj.pricision();
    row["deadline"] = (new Date(Number(row["deadline"]) * pricision_chain)).toLocaleString();

    let datas = utils.w3str_to_str(await cobj.datasOf(row["tokenId"]));

    //logger.debug("tokenId: " + row["tokenId"], "token info");
    //logger.debug("deadLine:" + row["deadline"]);
    //logger.debug(JSON.parse(datas));

    let typeUnitCount = utils.w3uint256_to_str(await cobj.typeUnitCountOf(row["tokenId"]));
    let typeUnitId    = await cobj.typeUnitIdOf(row["tokenId"]);
    let typeUnitName  = utils.w3bytes32_to_str(await typeUnit.nameOf(typeUnitId));
    row["model"] = typeUnitName;
    row["unit count"] = typeUnitCount.toString();

    //logger.debug("typeUnitId: " + typeUnitId);
    //logger.debug("typeUnitCount: " + typeUnitCount);
    //logger.debug("typeUnitName:" +  typeUnitName)

    let use_right = {
        "使用权通证ID": row["tokenId"],
        "算力资源ID": row["cvmId"],
        "拥有者": row["owner"],
        "类型ID":  utils.w3uint256_to_hex(typeUnitId),
        "类型":  await typeUnit.unitTypeOf(typeUnitId),
        "型号": typeUnitName,
        "数量": typeUnitCount.toString(),
        "使用截止日期": row["deadline"]
    }

    let unit = await typeUnit.unitIdOf(typeUnitId);
    let unitDatas = await gpu.datasOf(unit);

    let unitInfo = JSON.parse(utils.w3str_to_str(unitDatas));
    unitInfo["name"] = typeUnitName;

    //logger.debug(use_right,  "token info: " + tokenId);
    //logger.debug(unitInfo, "型号参数");

    return {
        use_right: use_right,
        unit_info: unitInfo,
        row: row
    }

}

async function tokensByOwner(owner) {
    let use_right= await utils.contract("SCPNSUseRightToken");
    let typeUnit = await utils.contract("SCPNSTypeUnit");
    let gpu      = await utils.contract("SCPNSGpuList");

    let amounts = await use_right.balanceOf(user);
    let list = [];
    for (let i = 0; i < amounts; i++) {
        let tokenId = await use_right.tokenOfOwnerByIndex(user, owner_count - 1);
        let datas = await datas_from_token_id(tokenId);
        list.push(datas["row"]);
    } 
    return list;
}

async function tokensByTokenId(tokenId) {
    let use_right= await utils.contract("SCPNSUseRightToken");
    let list = [];
    let datas = await datas_from_token_id(tokenId);
    list.push(datas["row"]);
    return list;
}
async function works() {
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
        let tokenId = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
        let datas = await datas_from_token_id(tokenId);
        list.push(datas["row"]);

        //let gpuDatas = utils.w3str_to_str(await gpu.datasOf(typeId);
    } 
    logger.table(list, "all token");
}

module.exports = {
    works,
    datas_from_token_id,
    tokensByTokenId,
    tokensByOwner,
    type_unit_id_of
}
