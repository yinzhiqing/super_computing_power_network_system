const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");
const { contracts_load }    = require("./contracts.js");

async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    return await cobj.hasRole(brole, address);
}

async function use_right_exists(token_id) {
    let cobj     = await utils.contract("SCPNSUseRightToken");
    return await cobj.exists(token_id);
}

async function wait_use_right_exists(token_id) {
    let cobj     = await utils.contract("SCPNSUseRightToken");
    let exists   = false;
    while(exists == false) {
       exists = await cobj.exists(token_id);
       await utils.sleep(1);
    }
}

async function wait_comp_vm_exists(token_id) {
    let cobj     = await utils.contract("SCPNSComputilityVM");
    let exists   = false;
    while(exists == false) {
       exists = await cobj.exists(token_id);
       await utils.sleep(1);
    }
}

async function wait_comp_unit_exists(token_id) {
    let cobj     = await utils.contract("SCPNSComputilityUnit");
    let exists   = false;
    while(exists == false) {
       exists = await cobj.exists(token_id);
       await utils.sleep(1);
    }
}

async function new_token_id(pre) {
    var date = new Date();
    return web3.utils.sha3(pre + date.getTime().toString());
}

async function type_unit_id_of(tokenId) {
    let cobj     = await utils.contract("SCPNSUseRightToken");
    let typeUnitId    = await cobj.typeUnitIdOf(tokenId);
    return typeUnitId;
}

async function datas_from_comp_unit_id(token_id) {
    let compUnit = await utils.contract("SCPNSComputilityUnit");
    let typeUnit = await utils.contract("SCPNSTypeUnit");

    logger.debug("token address: " + compUnit.address);

    let name = await compUnit.name();
    logger.debug("name: " + name);

    let row = new Map();
    row["tokenId"] = utils.w3uint256_to_hex(token_id);

    typeUnitId = utils.w3uint256_to_hex(await compUnit.typeUnitIdOf(row["tokenId"]));
    row["typeUnitId"] = typeUnitId;
    row["typeUnitName"] = utils.w3bytes32_to_str(await typeUnit.nameOf(typeUnitId));
    row["unitType"] = await typeUnit.unitTypeOf(typeUnitId);
    row["totalSupply"] = utils.w3uint256_to_str(await compUnit.typeUnitCountOf(row["tokenId"]));
    row["leaveCount"] = utils.w3uint256_to_str(await compUnit.leaveCountOf(row["tokenId"]));

    let datas = utils.w3str_to_str(await compUnit.datasOf(row["tokenId"]));
    logger.debug("tokenId: " + row["tokenId"], "token info");
    logger.debug("datas: ");
    logger.debug(JSON.parse(datas));

    let infos = {
        "算力单元ID" : row["tokenId"],
        "算力类型ID": row["typeUnitId"],
        "算力类型名称": row["typeUnitName"],
        "算力类型": row["unitType"],
        "总数量": row["totalSupply"],
        "剩余数量": row["leaveCount"]
    }
      
    return {
        form: infos,
        row: row
    }
}

//算力资源信息
async function datas_from_comp_vm_id(tokenId) {
    let cobj     = await utils.contract("SCPNSComputilityVM");
    let typeUnit = await utils.contract("SCPNSTypeUnit");
    let gpu      = await utils.contract("SCPNSGpuList");

    let row = new Map();
    row["tokenId"] = utils.w3uint256_to_hex(tokenId);
    row["owner"] = await cobj.ownerOf(row["tokenId"]);
    row["revenueValue"] = Number(await cobj.revenueValueOf(row["tokenId"]));
    row["deadline"] = await cobj.deadLine(row["tokenId"]);
    let pricision_chain = await cobj.pricision();
    row["deadline"] = (new Date(Number(row["deadline"]) * pricision_chain)).toLocaleString();

    let datas = utils.w3str_to_str(await cobj.datasOf(row["tokenId"]));

    let typeUnitCount = utils.w3uint256_to_str(await cobj.typeUnitCountOf(row["tokenId"]));
    let typeUnitId    = await cobj.typeUnitIdOf(row["tokenId"]);
    let typeUnitName  = utils.w3bytes32_to_str(await typeUnit.nameOf(typeUnitId));
    row["model"] = typeUnitName;
    row["unit count"] = typeUnitCount.toString();

    let infos = {
        "算力资源ID": row["tokenId"],
        "资源拥有者": row["owner"],
        "类型ID":  utils.w3uint256_to_hex(typeUnitId),
        "类型":  await typeUnit.unitTypeOf(typeUnitId),
        "型号": typeUnitName,
        "数量": typeUnitCount.toString(),
        "可发行收益权通证权益值": row["revenueValue"],
        "使用截止日期": row["deadline"]
    }

    let unit = await typeUnit.unitIdOf(typeUnitId);
    let unitDatas = await gpu.datasOf(unit);

    let unitInfo = JSON.parse(utils.w3str_to_str(unitDatas));
    unitInfo["name"] = typeUnitName;

    return {
        form: infos,
        unit_info: unitInfo,
        row: row
    }
}

//使用权通证信息
async function datas_from_use_right_id(tokenId) {
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
    row["isValid"] = await cobj.isValid(row["tokenId"]);
    let pricision_chain = await cobj.pricision();
    logger.debug("pricision: " +  Number(pricision_chain));
    logger.debug("deadline:" + row["deadline"]);
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

    let use_right_form = {
        "使用权通证ID": row["tokenId"],
        "算力资源ID": row["cvmId"],
        "拥有者": row["owner"],
        "类型ID":  utils.w3uint256_to_hex(typeUnitId),
        "类型":  await typeUnit.unitTypeOf(typeUnitId),
        "型号": typeUnitName,
        "数量": typeUnitCount.toString(),
        "使用截止日期": row["deadline"],
        "*是否有效": (row["isValid"] ? "有效" : "无效"),
    }

    let unit = await typeUnit.unitIdOf(typeUnitId);
    let unitDatas = await gpu.datasOf(unit);

    let unitInfo = JSON.parse(utils.w3str_to_str(unitDatas));
    unitInfo["name"] = typeUnitName;


    return {
        form: use_right_form,
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
        let datas = await datas_from_use_right_id(tokenId);
        list.push(datas["row"]);
    } 
    return list;
}

async function tokensByTokenId(tokenId) {
    let use_right= await utils.contract("SCPNSUseRightToken");
    let list = [];
    let datas = await datas_from_use_right_id(tokenId);
    list.push(datas["row"]);
    return list;
}

//获取所有使用权通证
async function works(latest_count) {
    let cobj     = await utils.contract("SCPNSUseRightToken");
    let typeUnit = await utils.contract("SCPNSTypeUnit");
    let gpu      = await utils.contract("SCPNSGpuList");
    logger.debug("token address: " + cobj.address);

    let name = await cobj.name();
    logger.debug("name: " + name);
    let amounts = await cobj.totalSupply();
    logger.debug("totalSupply: " + amounts);
    let list = [];
    let start = utils.min_from_right(amounts, latest_count);
    for (let i = start; i < amounts; i++) {
        let tokenId = utils.w3uint256_to_hex(await cobj.tokenByIndex(i));
        let rights = await datas_from_use_right_id(tokenId);
        let cvm    = await datas_from_comp_vm_id(rights.row.cvmId);
        logger.form("使用权通证信息", rights.form, cvm.form);
        list.push(rights["row"]);
        //let gpuDatas = utils.w3str_to_str(await gpu.datasOf(typeId);
    } 
    logger.table(list, "使用权通证列表(最大显示数量: " + latest_count + ")");
}

async function show_use_rights_of(ids) {
    let token_ids = [];
    token_ids = typeof(ids) == "string" ? [ids] : ids;
    for (let i = 0; i< token_ids.length; i++) {
        let rights = await datas_from_use_right_id(token_ids[i]);
        logger.form("使用权通证基本信息", rights.form);
    }
}

async function show_comp_units(ids) {
    let token_ids = [];
    logger.debug("ids typeof: " + typeof(ids));
    token_ids = typeof(ids) == "string" ? [ids] : ids;
    for (let i = 0; i< token_ids.length; i++) {
        let rights = await datas_from_comp_unit_id(token_ids[i]);
        logger.form("算力单元基本信息", rights["infos"]);
    }
}

async function show_comp_vm(ids) {
    let token_ids = [];
    logger.debug("ids typeof: " + typeof(ids));
    token_ids = typeof(ids) == "string" ? [ids] : ids;
    for (let i = 0; i< token_ids.length; i++) {
        let rights = await datas_from_comp_vm_id(token_ids[i]);
        logger.form("算力资源基本信息", rights["infos"]);
    }
}

async function select_use_right_id(owner) {
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let use_right_count = await use_right.balanceOf(owner);

    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenOfOwnerByIndex(owner, i));
        return use_right_id;
    }
    return null;
}

async function select_comp_vm_ids_of_owner(owner, type) {
    logger.debug("select_comp_vm_ids_of_owner(" + owner + "," + type + ")")
    let computility_vm = await utils.contract("SCPNSComputilityVM");
    let typeUnit = await utils.contract("SCPNSTypeUnit");
    let amounts = await computility_vm.balanceOf(owner);
    let list = [];
    count = 0;
    for (let i = 0; i < amounts; i++) {
        let token_id = await computility_vm.tokenOfOwnerByIndex(owner, i);
        let free = await computility_vm.isFree(token_id);
        if (false == free) {
            continue;
        }

        let typeUnitId = await computility_vm.typeUnitIdOf(token_id);
        let typeUnitName  = utils.w3bytes32_to_str(await typeUnit.nameOf(typeUnitId));

        if (type == typeUnitName) {
            list.push(token_id);
            return token_id;
        }
    } 
    return null;
}

async function select_comp_unit_ids_of_owner(owner, type, count) {

    logger.debug("select_comp_unit_ids_of_owner(" + owner + "," + type + "," + count + ")");
    let computility_unit = await utils.contract("SCPNSComputilityUnit");
    let typeUnit         = await utils.contract("SCPNSTypeUnit");
    let amounts         = await computility_unit.balanceOf(owner);
    for (let i = 0; i < amounts; i++) {
        let token_id = await computility_unit.tokenOfOwnerByIndex(owner, i);
        let leaveCount = await computility_unit.leaveCountOf(token_id);
        if (leaveCount < count) {
            logger.debug("resources(" + token_id +")  cannot meet demand in SCPNSComputilityUnit");
            continue;
        }
        let type_unit_id   = utils.w3uint256_to_hex(await computility_unit.typeUnitIdOf(token_id));
        let type_unit_name = utils.w3bytes32_to_str(await typeUnit.nameOf(type_unit_id));

        if (type == type_unit_name) {
            return token_id;
        }
    } 
    return null;
}

async function select_type_unit_id_of(name) {
    let typeUnit         = await utils.contract("SCPNSTypeUnit");
    let token_id         = await typeUnit.tokenIdOf(utils.str_to_w3bytes32(name));

    let existed = await typeUnit.exists(token_id);

    return existed == true ? token_id : null;
}

async function mint_use_right(user, to, use_right_id, deadline, computility_vm_id) {
    let use_right      = await utils.contract("SCPNSUseRightToken");

    let role   = "MINTER_ROLE";
    let signer = user.signer;
    let signer_address = await signer.getAddress(); 

    let has_miter = await has_role(use_right, signer_address, role);
    if (has_miter != true) {
        throw(signer_address + " no minter role." );
    } 

    logger.warning(deadline);
    let rows = [];
    //使用权通证时间与算力资源寿命相同
    let datas = utils.json_to_w3str({data: "test"});
    logger.debug("new token: " + use_right_id + " deadline: " + deadline);
    logger.debug("vm id: " + computility_vm_id);

    let tx = await use_right.connect(signer).mint(to, use_right_id,  deadline, 
        computility_vm_id, datas);

    logger.debug(tx);
    rows.push({
        to: to,
        token_id: use_right_id,
    });

    return rows;
}

async function renewal_use_right(user, use_right_id, times) {
    logger.debug("renewal_use_right:" + use_right_id);
    let use_right      = await utils.contract("SCPNSUseRightToken");

    let role   = "CONTROLLER_ROLE";
    let signer = user.signer;
    let signer_address = await signer.getAddress(); 

    let has = await has_role(use_right, signer_address, role);
    if (has != true) {
        throw(signer_address + " no controller role." );
    } 

    let rows = [];
    //使用权通证时间与算力资源寿命相同

    let tx = await use_right.connect(signer).renewal(use_right_id, times);

    logger.debug(tx);
    rows.push({
        token_id: use_right_id,
        times: times
    });

    return rows;
}

async function reset_lifetime_use_right(user, use_right_id, life_time) {
    logger.debug("renewal_use_right:" + use_right_id);
    let use_right      = await utils.contract("SCPNSUseRightToken");

    let role   = "CONTROLLER_ROLE";
    let signer = user.signer;
    let signer_address = await signer.getAddress(); 

    let has = await has_role(use_right, signer_address, role);
    if (has != true) {
        throw(signer_address + " no controller role." );
    } 

    let rows = [];
    //使用权通证时间与算力资源寿命相同

    let tx = await use_right.connect(signer).resetLifeTime(use_right_id, life_time);

    logger.debug(tx);
    rows.push({
        token_id: use_right_id,
        life_time:life_time, 
    });

    return rows;
}
async function mint_comp_vm(user, to, token_id, computility_unit_id, count, deadline) {
    logger.debug("mint computility vm");
    let computility_vm   = await utils.contract("SCPNSComputilityVM");

    let rows = [];

    let role   = "MINTER_ROLE";
    let signer = user.signer; 

    let has_miter = await has_role(computility_vm, to, role);
    if (has_miter != true) {
        throw(to + " no minter role." );
    } 

    let datas = utils.json_to_w3str({data: "test"});
    logger.debug("new token: " + token_id + " deadline: " + deadline);

    let tx = await computility_vm.connect(signer).mint(to, token_id,  deadline, 
        [computility_unit_id], [count], datas);

    rows.push({
        to: to,
        token_id: token_id,
        computility_unit_id: computility_unit_id,
        typeUnitCount: count,
    })
    return rows;
}

async function mint_comp_unit(user, to, token_id, count, type) {
    logger.debug("mint computility unit");
    let computility_unit = await utils.contract("SCPNSComputilityUnit");
    let type_unit        = await utils.contract("SCPNSTypeUnit");

    let role   = "MINTER_ROLE";
    let signer = user.signer; 

    let has_miter = await has_role(computility_unit, to, role);
    if (has_miter != true) {
        logger.error(to + " no minter role." );
        return;
    } 

    let type_unit_id = await select_type_unit_id_of(type);
    if(type_unit_id == null) {
        throw("资源类型" + type + "不存在。");
    }
    logger.debug("typeUnit id: " + type_unit_id);

    let type_unit_name = type;
    logger.debug("typeUnitName: " + type_unit_name)

    let datas = utils.json_to_w3str({data: type_unit_name});
    logger.debug("new token: " + token_id);

    let tx = await computility_unit.connect(signer).mint(to, token_id,  type_unit_id, count, datas);

    return {
        to: to,
        token_id: token_id,
        type_name: type_unit_name,
        type_unit_id: utils.w3uint256_to_hex(type_unit_id),
        type_unit_count: utils.w3uint256_to_str(count)
    };
}


module.exports = {
    works,
    datas_from_use_right_id,
    datas_from_comp_unit_id,
    datas_from_comp_vm_id,
    tokensByTokenId,
    tokensByOwner,
    type_unit_id_of, 
    new_token_id,
    mint_use_right,
    renewal_use_right,
    reset_lifetime_use_right,
    mint_comp_vm,
    mint_comp_unit,
    use_right_exists,
    wait_comp_unit_exists,
    wait_comp_vm_exists,
    wait_use_right_exists,
    select_use_right_id,
    select_comp_vm_ids_of_owner,
    select_comp_unit_ids_of_owner,
    select_type_unit_id_of,
    show_use_rights_of,
    show_comp_units,
    show_comp_vm,
}
