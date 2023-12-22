const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");

async function works() {
    let cobj     = await utils.contract("SCPNSComputilityVM");
    let compUnit = await utils.contract("SCPNSComputilityUnit");
    let typeUnit = await utils.contract("SCPNSTypeUnit");
    logger.warning("算力信息");

    let name = await cobj.name();
    logger.debug("name: " + name);

    let amounts = await cobj.totalSupply();
    logger.debug("totalSupply: " + amounts);
    let list = [];
    for (let i = 0; i < amounts; i++) {
        let row = new Map();
        row["tokenId"]      = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
        row["算力单元数量"] = Number(utils.w3uint256_to_str(await cobj.computilityUnitCountOf(row["tokenId"])));
        row["deadline"]     = Number(await cobj.deadLine(row["tokenId"])) * 1000;
        row["deadline"]     =  (new Date(row["deadline"])).toLocaleString();
        let typeUnitId      = await cobj.typeUnitIdOf(row["tokenId"])
        let typeUnitName    = utils.w3bytes32_to_str(await typeUnit.nameOf(typeUnitId));
        row["型号"]         = typeUnitName;
        row["数量"]         = Number(utils.w3uint256_to_str(await cobj.typeUnitCountOf(row["tokenId"])));
        row["自由状态"]     = utils.w3uint256_to_str(await cobj.isFree(row["tokenId"]));


        let datas = utils.w3str_to_str(await cobj.datasOf(row["tokenId"]));
        logger.debug("tokenId: " + row["tokenId"], "token info");
        logger.debug("owner: " + await cobj.ownerOf(row["tokenId"]));
        logger.debug("deadline: " + row["deadline"]);
        logger.debug("datas: ");
        logger.debug(JSON.parse(datas));

        list.push(row);

    } 
    logger.table(list);
}

module.exports = {
    works
}
