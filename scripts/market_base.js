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

async function select_revenue_id(signer_address) {
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let revenue_token    = contracts.RevenueToken;
    let skeep = [''];
    let total = await revenue_token.totalSupply();
    logger.debug("revenue count: " + Number(total));
    let list = [];
    for (let i = 0; i < total; i++) {
        let token_id    = await revenue_token.tokenByIndex(i);
        let owner       = await revenue_token.ownerOf(token_id);

        if (skeep.includes(token_id)) {
            continue;
        }

        return token_id;
    }
    throw("没有收益权通证");

}


async function _use_right_info_load(use_right_id) {
    let type_unit_id = await sur.type_unit_id_of(use_right_id);
    let rights       = await sur.datas_from_token_id(use_right_id);

    return  rights["use_right"];
}
async function _use_right_info_print(use_right_id) {
    let use_right_info = await _use_right_info_load(use_right_id);

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
        let price        = sale_info[2].toString();

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
        let sale_info = await gpu_store._revenueTokenStore(saleIds[i]);

        let token_id = utils.w3uint256_to_hex(sale_info[0]);
        let value   = await revenue_token.balanceOf(token_id);
        let slot    = await revenue_token.slotOf(token_id);
        //let owner   = await revenue_token.ownerOf(token_id);
        let show_sale_info = {
        "收益权通证": utils.w3uint256_to_hex(sale_info[0]),
        "算力资源ID": utils.w3uint256_to_hex(slot),
        //"通证拥有者": owner,
        "挂单者" : sale_info[2],
        "权益值" : value.toString(),
        "价格" : sale_info[1].toString(),
        }
        logger.form("收益权通证市场信息表", show_sale_info);
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
        let token_id = await revenue_token.tokenByIndex(i);
        let owner   = await revenue_token.ownerOf(token_id);
        let slot    = await revenue_token.slotOf(token_id);
        let value   = await revenue_token.balanceOf(token_id);
        let balance = await vnet_token.balanceOf(owner);

        let vms = await sur.datas_from_comp_vm_id(slot);
        let vms_info = vms["infos"];
        let revenue_info = {
            "收益权通证ID": utils.w3uint256_to_shex(token_id),
            "通证拥有者": owner,
            //"算力资源ID": utils.w3uint256_to_hex(slot),
            "通证权益值": Number(value) ,
            "稳定币数量": balance.toString()
        };

        logger.form("收益权通证信息", vms_info, revenue_info);
        list.push(revenue_info);
    }
    logger.table(list);
    return list;
}

async function use_orders() {
    logger.info("使用权通证交易记录");
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
            price:          order[1].toString(),
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
    logger.info("收益权通证交易记录");
    let contracts        = await contracts_load();
    let gpu_store        = contracts.GPUStore;
    let revenue_token    = contracts.RevenueToken;
    let vnet_token       = contracts.VNetToken;
    let to               = gpu_store.address;

    let msgs = [];
    filter = await gpu_store.filters.TradeRevenueTokenEvent(null, null, null);
    filter["fromBlock"] = "earliest";
    filter["toBlock"] = "latest";
    logs = await ethers.provider.getLogs(filter);
    for (i in logs) {
        log = logs[i];
        logger.debug(log);
        data = log["data"];
        datas = web3.eth.abi.decodeParameters(["uint256", "uint256"], data);
        let event_data = { 
            //blockNumber: log["blockNumber"],
            //blockHash: log["blockHash"],
            //transactionHash: log["transactionHash"],
            "收益权ID": utils.w3uint256_to_shex(log["topics"][1]),
            "价格": datas["0"].toString(),
            "挂单者": utils.w3address_to_hex(log["topics"][2]),
            "购买者": utils.w3address_to_hex(log["topics"][3]),
            "时戳": datas["1"], 
        };
        msgs.push(event_data);
    }
    logger.table(msgs);
}
async function revenue_distribute_revenue() {
    logger.info("结算记录");
    let contracts        = await contracts_load();
    let gpu_store        = contracts.GPUStore;
    let revenue_token    = contracts.RevenueToken;
    let vnet_token       = contracts.VNetToken;
    let to               = gpu_store.address;

    let msgs = [];
    filter = await gpu_store.filters.DistributeRevenueEvent(null);
    filter["fromBlock"] = "earliest";
    filter["toBlock"] = "latest";
    logs = await ethers.provider.getLogs(filter);
    for (i in logs) {
        log = logs[i];
        logger.debug(log);
        data = log["data"];
        datas = web3.eth.abi.decodeParameters(["uint256", "uint256"], data);
        let event_data = { 
            //blockNumber: log["blockNumber"],
            //blockHash: log["blockHash"],
            //transactionHash: log["transactionHash"],
            "收益权ID": utils.w3uint256_to_shex(log["topics"][1]),
            "分配VNet token": datas["0"],
            "收益账户地址": utils.w3address_to_hex(log["topics"][2]),
            "时戳": datas["1"], 
        };
        msgs.push(event_data);
    }
    logger.table(msgs);
    //msgs.forEach(function(item) {logger.table(item)});
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
    let sale_info = await gpu_store._gpuTokenStore(use_right_id);
    //let use_right_id  = utils.w3uint256_to_hex(sale_info[0]);
    let price         = sale_info[2].toString();

    logger.debug(sale_info);
    list.push({
        use_right_id: use_right_id,
        price: price,
        seller: sale_info[3],
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
    let revenue_info = {};
    let owners = [];
    let values = [];
    //==0 则说明没有创建过, 需要创建收益权通证
    if (token_count == 0) {
        logger.info("创建新的收益权");
        let revenue_value = await use_right.revenueValueOf(use_right_id);
        owners = [owner, await users.beneficiary.signer.getAddress()];
        let last = revenue_value;
        let avg = revenue_value / owners.length;
        for (let i = 0; i < owners.length -1; i++) {
            //注意不能整除的情况
            values.push(avg);
            last -= avg
        }
        values.push(last);
        logger.debug("算力资源ID" + utils.w3uint256_to_hex(cvmId));
        logger.debug("收益权获得者列表"+ "[" + owners.toString() + "]");
        logger.debug("收益权值"+ "[" + values.toString() + "]");    

        await market_link.mintRevenue(cvmId, owners, values);
        logger.info("成功创建新的收益权");
    } else {
        //查询收益权及对应的账户和所有值
        let owner_value = {};
        for(let i = 0; i < token_count; i++)  {
            let token_id = await revenue_token.tokenInSlotByIndex(cvmId, i);
            let owner   = await revenue_token.ownerOf(token_id);
            let value   = await revenue_token.balanceOf(token_id);
            owner_value[owner] = owner_value[owner] != undefined ? owner_value[owner] + value : value;
        }
        
        for(let key in owner_value) {
            owners.push(key);
            values.push(owner_value[key]);
        }
    }

    revenue_info = {
        "算力资源ID" : utils.w3uint256_to_hex(cvmId),
        "收益权获得者": "[" + owners.toString() + "]",
        "收益权值": "[" + values.toString() + "]",    
    };
    logger.debug(revenue_info);

    let addr0 = "0x0000000000000000000000000000000000000000";
    let approved = await use_right.connect(signer).getApproved(use_right_id);

    if (approved != to) {
        await use_right.connect(signer).approve(to, use_right_id);
        while(approved != to) {
            approved = await use_right.connect(signer).getApproved(use_right_id);
        }
    }

    let price = 10000;
    //算力使用权用户signer发起一个证明任务给指定的算力节点（use_right_id）
    await gpu_store.connect(signer).addGpuTokenToStore(use_right_id, price);

    let sale_info = {
       "市场":  to,
       "价格":  price,
    };
    logger.debug(sale_info);
    let use_right_info = await _use_right_info_load(use_right_id);
    logger.debug(use_right_info);
    logger.form("出售使用权通证信息", use_right_info, revenue_info, sale_info);
}

async function put_revenue(signer, revenue_id) {
    logger.info("收益权通证添加到市场");

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let to               = gpu_store.address;
    let market_link      = contracts.SCPNSMarketLink;
    let revenue_token    = contracts.RevenueToken;

    //1.
    // 获取钱包中account, 此account是使用权通证(revenue_id)的拥有者

    let owner   = await revenue_token.ownerOf(revenue_id);
    logger.debug("to: " + to);
    logger.debug("revenue_id: " + revenue_id);

    let addr0 = "0x0000000000000000000000000000000000000000";
    let approved = await revenue_token.connect(signer).getApproved(revenue_id);

    if (approved != to) {
        await revenue_token.connect(signer).approve(to, revenue_id);
        while(approved != to) {
            approved = await revenue_token.connect(signer).getApproved(revenue_id);
        }
    }

    let value   = await revenue_token.balanceOf(revenue_id);
    let revenue_info = {
        "算力资源ID" : utils.w3uint256_to_hex(revenue_id),
        "收益权获得者": "[" + owner.toString() + "]",
        "收益权值": "[" + value.toString() + "]",    
    };

    let price = 22000;
    //收益权用户signer发起一个证明任务给指定的算力节点（revenue_id）
    await gpu_store.connect(signer).addRevenueTokenToStore(revenue_id, price);

    let sale_info = {
       "市场":  to,
       "价格":  price,
    };
    logger.debug(sale_info);
    logger.form("出售收益权通证信息", revenue_info, sale_info);
}

async function buy_revenue(signer, revenue_id) {
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
    let sale_info = await gpu_store._revenueTokenStore(revenue_id);
    let price         = sale_info[1].toString();

    logger.debug(sale_info);
    list.push({
        revenue_id: revenue_id,
        price: price,
        seller: gpu_sale_info[2],
        buyer: buyer
    });

    await vnet_token.connect(signer).approve(gpu_store.address, price);

    let amount = await vnet_token.connect(signer).allowance(buyer, gpu_store.address);
    while(amount < price) {
        amount = await vnet_token.connect(signer).allowance(buyer, gpu_store.address);
    }
    await gpu_store.connect(signer).tradeRevenueToken(revenue_id);

    logger.table(list);
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
    filter,
    store_revenue,
    store_use,
    revenues,
    use_orders,
    revenue_orders,
    revenue_distribute_revenue,
    buy_use,
    put_use,
    buy_revenue,
    put_revenue,
    select_use_right_id,
    select_revenue_id,
    use_right_ids_of,
}
