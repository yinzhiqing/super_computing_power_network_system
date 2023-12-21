const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const gs_abi    = require("./datas/abis/GPUStore.json");
const sur       = require("./show_use_rights_base.js");
const { users, store }       = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

function filter(seller, token) {
    if (store.filter.seller.use == true) {
        if (store.filter.seller.list.includes(seller) == false) {
            return true;
        }
    }

    if (store.filter.tokens.use == true) {
        if (store.filter.tokens.list.includes(token) == false) {
            return true;
        }
    }

    return false;
}

async function select_use_right_id(signer_address) {
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let use_right_count = await use_right.balanceOf(signer_address);
    let skeep = [''];

    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenOfOwnerByIndex(signer_address, i));

        if (skeep.includes(use_right_id)) {
            continue;
        }

        return use_right_id;
    }
    throw("没有 use_right_id");

}

async function _use_right_info_print(use_right_id) {
    let type_unit_id = await sur.type_unit_id_of(use_right_id);
    let rights       = await sur.datas_from_token_id(use_right_id);
    let use_right_info = rights["use_right"];

    for(var k in use_right_info) {
        if (k.length >= 6) {
            logger.log(k + "\t\t\t" + use_right_info[k].toString());
        } else {
            logger.log(k + "\t\t\t\t" + use_right_info[k].toString());
        }
    }
}

async function store_use() {
    logger.info("使用权通证市场");

    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let to               = gpu_store.address;
    logger.debug("market address: " + to);
    logger.debug("vnet   address: " + await gpu_store._paymentToken());
    logger.debug("useRight address: " + await gpu_store._gpuToken());
    logger.debug("");

    let saleIds = await gpu_store.getGPUTokenForSaleIds();
    let list = []
    for (let i in saleIds) {
        let sale_info    = await gpu_store._gpuTokenStore(saleIds[i]);
        let use_right_id = utils.w3uint256_to_hex(sale_info[0]);
        let seller       = sale_info[3];
        let price        = Number(sale_info[2]);

        //过滤非目标出售信息
        if (filter(seller, use_right_id)) {
            continue;
        }

        logger.log("==========================================================================================================");
        logger.log("\t\t\t\t\t\t使用权通证市场信息表");
        logger.log("----------------------------------------------------------------------------------------------------------");

        await _use_right_info_print(use_right_id);
        logger.log("----------------------------------------------------------------------------------------------------------");
        logger.log("挂单者：\t\t\t" + seller);
        logger.log("价格(VNET Token)：\t\t" + price);
        logger.log("==========================================================================================================");

        list.push({
            "使用权通证ID": use_right_id,
            "价格": price,
        })

        logger.log("\t");
    }
    logger.table(list);
    return list;
}

async function store_revenue() {
    logger.info("收益权通证市场");

    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let revenue_token    = contracts.RevenueToken;
    let to               = gpu_store.address;
    logger.debug("market address: " + to);
    logger.debug("vnet   address: " + await gpu_store._paymentToken());
    logger.debug("");

    let saleIds = await gpu_store.getRevenueTokenForSaleIds();
    let list = []
    for (let i in saleIds) {
        let sale_info = await gpu_store._RevenueTokenStore(saleIds[i]);

        let token_id = utils.w3uint256_to_hex(sale_info[0]);
        let value   = await revenue_token.balanceOf(token_id);
        logger.log("==========================================================================================================");
        logger.log("\t\t\t\t\t\t收益权通证市场信息表");
        logger.log("----------------------------------------------------------------------------------------------------------");
        logger.log("----------------------------------------------------------------------------------------------------------");
        logger.log("收益权通证ID：\t\t\t" + sale_info[0]);
        logger.log("挂单者：\t\t\t" + sale_info[2]);
        logger.log("数量(VNET Token)：\t\t" + value.toString());
        logger.log("价格(VNET Token)：\t\t" + sale_info[1].toString());
        logger.log("==========================================================================================================");
        logger.log("\t");
    }
    return list;
}

async function revenues() {
    logger.info("收益权通证列表");
    let contracts        = await contracts_load();
    let dns              = contracts.SCPNSDns;
    let revenue_token    = contracts.RevenueToken;
    let gpu_store        = contracts.GPUStore;
    let vnet_token       = contracts.VNetToken;
    let to               = gpu_store.address;
    logger.debug("market address: " + gpu_store.address);
    logger.debug("revenue address: " + revenue_token.address);
    
    let total = await revenue_token.totalSupply();
    logger.debug("revenue count: " + Number(total));
    let list = [];
    for (let i = 0; i < total; i++) {
        let tokenId = await revenue_token.tokenByIndex(i);
        let owner   = await revenue_token.ownerOf(tokenId);
        let slot    = await revenue_token.slotOf(tokenId);
        let value   = await revenue_token.balanceOf(tokenId);
        let balance = await vnet_token.balanceOf(owner);
        list.push({
            "收益权通证ID": utils.w3uint256_to_hex(tokenId),
            "通证拥有者": owner,
            "算力资源ID": utils.w3uint256_to_hex(slot),
            "通证数量": Number(value),
            "稳定币数量": balance.toString()
        });
    }
    logger.table(list);
    return list;
}

async function orders() {
    logger.info("交易记录");
    let contracts        = await contracts_load();
    let revenue_token    = contracts.RevenueToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let to               = gpu_store.address;
    logger.debug("market address: " + to);
    logger.debug("vnet   address: " + await gpu_store._paymentToken());
    logger.debug("");
    
    let orders = await gpu_store.getOrderIds();
    let list = [];
    for (let i = 0; i < orders.length; i++) {
        let order = await gpu_store._orders(orders[i]);
        let charging_time = (new Date(Number(order[5]))).toLocaleString();
        charging_time = charging_time == undefined ? "" : charging_time;
        let row = {
            order_id:       utils.w3uint256_to_hex(orders[i]), 
            token_id:       utils.w3uint256_to_hex(order[0]),
            provider:       order[2],
            customer:       order[3],
            price:          Number(order[1]),
            trade_time:     (new Date(Number(order[4]))).toLocaleString(),
            charging_time:  (new Date(Number(order[5]))).toLocaleString()
        }

        let rights = await sur.datas_from_token_id(order[0]);
        let use_right_info = rights["use_right"];
        logger.log("==========================================================================================================");
        logger.log("\t\t\t\t\t\t使用权通证交易信息表");
        logger.log("----------------------------------------------------------------------------------------------------------");
        for(var k in use_right_info) {
            if (k.length >= 6) {
                logger.log(k + "\t\t\t" + use_right_info[k].toString());
            } else {
                logger.log(k + "\t\t\t\t" + use_right_info[k].toString());
            }
        }
        logger.log("----------------------------------------------------------------------------------------------------------");
        logger.log("挂单者: \t\t\t" + row.provider);
        logger.log("购买者: \t\t\t" + row.customer);
        logger.log("价格(VNET Token)：\t\t" + row.price);
        logger.log("购买时间\t\t\t" + row.trade_time);
        logger.log("续费时间\t\t\t" + (row.charging == undefined ? "无" : row.charging));
        logger.log("==========================================================================================================");
        logger.log("\t");

        list.push({
            "订单ID":       row.order_id, 
            "使用权通证ID": row.token_id,
            "价格":         row.price,
            //"挂单者":       row.provider,
            //"购买者":       row.customer,
            //"购买时间":     row.trade_time,
            //"续约时间":     row.charging_time,
        });
    }
    logger.table(list);
    return list;

}

async function revenue_orders() {
    logger.debug("start working...", "收益权交易记录");
    let contracts        = await contracts_load();
    let gpu_store        = contracts.GPUStore;
    let revenue_token    = contracts.RevenueToken;
    let vnet_token       = contracts.VNetToken;
    let to               = gpu_store.address;
    //await gpu_store.events.AddGPUTokenToStoreEvent("0xd34967bbedd89ccf8b9b11cacd5545dc93bb5d14f1397401a76131658655e715", "0xDB10B29830D75A8157BaB7442d3047Dc200D007E")

    let ev = await vnet_token.queryFilter('Transfer',
        26749720,
        "latest");

    logger.debug(ev);
}

async function buy_use(signer, use_right_id) {
    logger.debug("start working...", "购买通证");

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let vnet_token       = contracts.VNetToken;
    let to               = gpu_store.address;
    logger.debug("store address: " + gpu_store.address);
    logger.debug("vnet token address: " + vnet_token.address);

    let buyer = await signer.getAddress();
    logger.debug("buyer: " + buyer);

    let list = [];
    let gpu_sale_info = await gpu_store._gpuTokenStore(use_right_id);
    //let use_right_id  = utils.w3uint256_to_hex(gpu_sale_info[0]);
    let price         = Number(gpu_sale_info[2]);

    logger.debug(gpu_sale_info);
    list.push({
        use_right_id: use_right_id,
        price: price,
        seller: gpu_sale_info[3],
        buyer: buyer
    });

    await vnet_token.connect(signer).approve(gpu_store.address, price);

    let amount = await vnet_token.connect(signer).allowance(buyer, gpu_store.address);
    while(amount < price) {
        amount = await vnet_token.connect(signer).allowance(buyer, gpu_store.address);
    }
    await gpu_store.connect(signer).tradeGPUToken(use_right_id);

    logger.table(list);
}

async function put_use(signer, use_right_id) {
    logger.info("使用权通证添加到市场");

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let to               = gpu_store.address;
    let market_link      = contracts.SCPNSMarketLink;
    let revenue_token    = contracts.RevenueToken;

    //1.
    // 获取钱包中account, 此account是使用权通证(use_right_id)的拥有者
    let owner = await signer.getAddress();

    logger.debug("owner: " + owner);
    logger.debug("to: " + to);
    logger.debug("use_right_id: " + use_right_id);

    //检查使用权通证是否已经生成收益权通证
    let cvmId       = await use_right.computilityVMIdOf(use_right_id);
    let token_count = await revenue_token.tokenSupplyInSlot(cvmId);
    //==0 则说明没有创建过, 需要创建收益权通证
    if (token_count == 0) {
        logger.info("创建新的收益权");
        let revenue_value = await use_right.revenueValueOf(use_right_id);
        let owners = [owner, await users.beneficiary.signer.getAddress()];
        let values = [];
        let last = revenue_value;
        let avg = revenue_value / owners.length;
        for (let i = 0; i < owners.length -1; i++) {
            //注意不能整除的情况
            values.push(avg);
            last -= avg
        }
        values.push(last);
        logger.log("算力资源ID" + utils.w3uint256_to_hex(cvmId));
        logger.log("收益权获得者列表"+ "[" + owners.toString() + "]");
        logger.log("收益权值"+ "[" + values.toString() + "]");    
        
        //await market_link.mintRevenue(cvmId, owners, values);
        logger.info("成功创建新的收益权");
    }

    let addr0 = "0x0000000000000000000000000000000000000000";
    let approved = await use_right.connect(signer).getApproved(use_right_id);
    logger.debug("pre call approved: " + approved);

    if (approved != to) {
        await use_right.connect(signer).approve(to, use_right_id);
        while(approved != to) {
            approved = await use_right.connect(signer).getApproved(use_right_id);
        }
    }

    let price = 10000;
    //算力使用权用户signer发起一个证明任务给指定的算力节点（use_right_id）
    //await gpu_store.connect(signer).addGpuTokenToStore(use_right_id, price);

    await title_print("出售使用权通证信息");
    await _use_right_info_print(use_right_id);
    logger.log("----------------------------------------------------------------------------------------------------------");
    logger.log("市场地址: \t\t\t" + to);
    logger.log("价格(VNET Token):\t\t" + price);
    logger.log("==========================================================================================================");
}

async function title_print(title) {
    logger.log("==========================================================================================================");
    logger.log("\t\t\t\t--" + title + "--");
    logger.log("==========================================================================================================");
}
async function use_right_ids_of(user) {

    let address          = await user.signer.getAddress();
    let alias            = user.alias;
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let use_right_count = await use_right.balanceOf(address);

    let list = []
    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenOfOwnerByIndex(address, i));
        let cvm_id       = utils.w3uint256_to_hex(await use_right.computilityVMIdOf(use_right_id));
        list.push({
            "使用权通证ID": use_right_id,
            "算力资源ID": cvm_id
        });

    }
    logger.table(list, alias + " 拥有的使用权通证")
    return list;

}

module.exports = {
    store_revenue,
    store_use,
    revenues,
    orders,
    revenue_orders,
    buy_use,
    put_use,
    select_use_right_id,
    use_right_ids_of,
}
