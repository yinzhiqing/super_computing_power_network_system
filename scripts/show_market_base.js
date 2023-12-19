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

async function store_use() {
    logger.debug("start working...", "使用权通证市场");

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let to               = gpu_store.address;
    logger.log("market address: " + to);
    logger.log("vnet   address: " + await gpu_store._paymentToken());
    logger.log("");

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
        let type_unit_id = await sur.type_unit_id_of(use_right_id);
        let rights       = await sur.datas_from_token_id(use_right_id);
        let use_right_info = rights["use_right"];

        logger.log("==========================================================================================================");
        logger.log("\t\t\t\t\t\t使用权通证市场信息表");
        logger.log("----------------------------------------------------------------------------------------------------------");

        for(var k in use_right_info) {
            if (k.length >= 6) {
                logger.log(k + "\t\t\t" + use_right_info[k].toString());
            } else {
                logger.log(k + "\t\t\t\t" + use_right_info[k].toString());
            }
        }
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
    logger.debug("start working...", "收益权通证市场");

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let revenue_token    = contracts.RevenueToken;
    let to               = gpu_store.address;
    logger.log("market address: " + to);
    logger.log("vnet   address: " + await gpu_store._paymentToken());
    logger.log("");

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
        logger.log("数量(VNET Token)：\t\t" + Number(value));
        logger.log("价格(VNET Token)：\t\t" + Number(sale_info[1]));
        logger.log("==========================================================================================================");
        logger.log("\t");
    }
    return list;
}

async function revenues() {
    logger.debug("start working...", "收益权通证列表");
    let contracts        = await contracts_load();
    let dns              = contracts.SCPNSDns;
    let to               = await dns.addressOf("GPUStore");
    let revenue_token    = contracts.RevenueToken;
    let gpu_store        = contracts.GPUStore;
    let vnet_token       = contracts.VNetToken;
    logger.log("market address: " + gpu_store.address);
    logger.log("revenue address: " + revenue_token.address);
    
    let total = await revenue_token.totalSupply();
    logger.debug(total);
    let list = [];
    for (let i = 0; i < total; i++) {
        let tokenId = await revenue_token.tokenByIndex(i);
        let owner   = await revenue_token.ownerOf(tokenId);
        let value   = await revenue_token.balanceOf(tokenId);
        let balance = await vnet_token.balanceOf(owner);
        list.push({
            "使用权通证ID": tokenId,
            "通证拥有者": owner,
            "通证数量": value,
            "稳定币数量": balance
        });
    }
    logger.table(list);
    return list;
}

async function orders() {
    logger.debug("start working...", "交易记录");
    let contracts        = await contracts_load();
    let revenue_token    = contracts.RevenueToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let to               = gpu_store.address;
    logger.log("market address: " + to);
    logger.log("vnet   address: " + await gpu_store._paymentToken());
    logger.log("");
    
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
        logger.log("最近扣费\t\t\t" + row.charging);
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

module.exports = {
    store_revenue,
    store_use,
    revenues,
    orders,
    revenue_orders
}
