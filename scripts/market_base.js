const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const gs_abi    = require("./datas/abis/GPUStore.json");
const urb       = require("./use_rights_base.js");
const { users, store }       = require("./datas/env.config.js");
const { contracts_load }     = require("./contracts.js");

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

async function mint_revenue_or_load_revenue_by_use_right_id(signer, use_right_id, owners) {
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let revenue_token    = contracts.RevenueToken;

    //检查使用权通证是否已经生成收益权通证
    let cvmId       = await use_right.computilityVMIdOf(use_right_id);
    let token_count = await revenue_token.tokenSupplyInSlot(cvmId);
    let revenue_info = {};
    //==0 则说明没有创建过, 需要创建收益权通证
    if (token_count == 0) {
        logger.info("创建新的收益权");
        //owners = [owner, await users.beneficiary.signer.getAddress()];
        revenue_info = await mint_revenue_by_use_right_id(signer, use_right_id, owners);

        logger.info("成功创建新的收益权");
    } else {
        //查询收益权及对应的账户和所有值
        revenue_info = await load_revenue_info_by_slot(cvmId);
        logger.info("使用已有的收益权通证");
    }

    return revenue_info;

}

async function mint_revenue_by_use_right_id(signer, use_right_id, owners) {
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let market_link      = contracts.SCPNSMarketLink;
    let revenue_token    = contracts.RevenueToken;

    let cvmId       = await use_right.computilityVMIdOf(use_right_id);
    let token_count = await revenue_token.tokenSupplyInSlot(cvmId);

    revenue_total = await use_right.revenueValueOf(use_right_id);
    //owners = [owner, await users.beneficiary.signer.getAddress()];
    let last = revenue_total;
    let avg = revenue_total/ owners.length;
    let values = [];
    for (let i = 0; i < owners.length -1; i++) {
        //注意不能整除的情况
        values.push(avg);
        last -= avg
    }
    values.push(last);
    logger.debug("算力资源ID" + utils.w3uint256_to_hex(cvmId));
    logger.debug("收益权获得者列表"+ "[" + owners.toString() + "]");
    logger.debug("收益权值"+ "[" + values.toString() + "]");    

    await market_link.connect(signer).mintRevenue(cvmId, owners, values);

    let revenue_form = {
        "算力资源ID" : utils.w3uint256_to_hex(cvmId),
        "收益权益值": revenue_total, 
    };
    for (let i = 0; i < owners.length; i++) {
        revenue_form["    " + owners[i]] = values[i];
    }
    return {
        form: revenue_form,
        revenue_total: revenue_total,
        owners: owners,
        values: values
    };
}

async function load_revenue_info_by_use_right_id(use_right_id) {
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let cvmId            = await use_right.computilityVMIdOf(use_right_id);

    return await load_revenue_info_by_slot(cvmId);
}

async function load_revenue_info_by_slot(slot /*cvmId*/) {
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let revenue_token    = contracts.RevenueToken;
    let token_count = await revenue_token.tokenSupplyInSlot(slot);
    let owner_value = {};
    let owners = [];
    let values = [];
    let token_ids = [];
    let revenue_total = 0;
    for(let i = 0; i < token_count; i++)  {
        let token_id = await revenue_token.tokenInSlotByIndex(slot, i);
        let owner   = await revenue_token.ownerOf(token_id);
        let value   = await revenue_token.balanceOf(token_id);
        revenue_total += Number(value);
        owner_value[owner] = owner_value[owner] != undefined ? owner_value[owner] + value : value;
        token_ids.push(token_id);
    }

    for(let key in owner_value) {
        owners.push(key);
        values.push(owner_value[key]);
    }

    let revenue_form = {
        "算力资源ID" : utils.w3uint256_to_hex(slot),
        "收益权益值": revenue_total, 
    };

    for (let i = 0; i < owners.length; i++) {
        revenue_form["    " + owners[i]] = values[i];
    }

    return {
        form: revenue_form,
        revenue_total: revenue_total,
        owners: owners,
        values: values
    };
}

async function select_use_right_id_from_market() {
    let contracts        = await contracts_load();
    let gpu_store        = contracts.GPUStore;
    let saleIds          = await gpu_store.getGPUTokenForSaleIds();
    for (let i in saleIds) {
        let use_right_id = utils.w3uint256_to_hex(saleIds[i]);
        return use_right_id;
    }
    return null;
}

async function select_revenue_id(signer_address, use_right_id = null) {
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let revenue_token    = contracts.RevenueToken;
    let total = await revenue_token.totalSupply();
    logger.debug("revenue count: " + Number(total));
    let list = [];

    let fixed_slot = null;
    if (use_right_id)  {
        vmid = await urb.get_comp_vm_id_by_use_right_id(use_right_id);
    }
    for (let i = 0; i < total; i++) {
        let token_id    = await revenue_token.tokenByIndex(i);
        let owner       = await revenue_token.ownerOf(token_id);
        let slot        = await revenue_token.slotOf(token_id);

        if (owner != signer_address) {
            continue;
        }

        if (fixed_slot != null && utils.w3uint256_to_hex(slot) != utils.w3uint256_to_hex(fixed_slot)) {
            continue;
        }

        return token_id;
    }
    throw("没有收益权通证");
}

async function _use_right_info_load(use_right_id) {
    let type_unit_id = await urb.type_unit_id_of(use_right_id);
    let rights       = await urb.datas_from_use_right_id(use_right_id);

    return  rights.form;
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

async function store_use(title = "使用权通证市场") {
    logger.debug(title);

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

        let use_right_info = await _use_right_info_load(use_right_id);
        let use_form = {
            "挂单者": seller,
            "价格(VNET Token)": price,
        }

        list.push({
            "使用权通证ID": use_right_id,
            "价格": price,
        })
        //logger.form("使用权通证市场信息表", use_right_info, use_form);

    }
    logger.table(list, title);
    return list;
}

async function store_revenue(title = "收益权通证市场") {
    logger.debug(title);

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
    logger.debug(saleIds);
    let list = []
    for (let i in saleIds) {
        let sale_info = await gpu_store._revenueTokenStore(saleIds[i]);

        let token_id  = utils.w3uint256_to_hex(sale_info[0]);
        let value     = await revenue_token.balanceOf(token_id);
        let slot      = await revenue_token.slotOf(token_id);
        //let owner   = await revenue_token.ownerOf(token_id);
        logger.debug(sale_info);
        let show_sale_info = {
            "收益权通证": utils.w3uint256_to_hex(sale_info[0]),
            "算力资源ID": utils.w3uint256_to_hex(slot),
            //"通证拥有者": owner,
            "挂单者" : sale_info[3],
            "权益值" : value.toString(),
            "价格" : sale_info[2].toString(),
        }
        list.push({
            "收益权通证": utils.w3uint256_to_hex(sale_info[0]),
            "挂单者" : sale_info[3],
            "价格" : sale_info[2].toString(),
        })
        //logger.form("收益权通证市场信息表", show_sale_info);
    }
    logger.table(list, title);
    return list;
}

async function revenues(title = "收益权通证列表") {
    logger.debug(title);
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
        logger.debug("token_id: " + token_id);
        let value   = await revenue_token.balanceOf(token_id);
        logger.debug("value: " + value);
        let balance = await vnet_token.balanceOf(owner);

        let vms = await urb.datas_from_comp_vm_id(slot);
        let vms_info = vms["infos"];
        let revenue_info = {
            "收益权通证ID": utils.w3uint256_to_hex(token_id.toString()),
            "通证拥有者": owner,
            //"算力资源ID": utils.w3uint256_to_hex(slot),
            "通证权益值": Number(value),
            "稳定币数量": balance.toString()
        };

        logger.form("收益权通证信息", vms_info, revenue_info);
        list.push(revenue_info);
    }
    logger.table(list, title);
    return list;
}

async function use_orders(latest_count = 2, title = "使用权通证交易记录") {
    logger.debug(title);
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
    let start = utils.min_from_right(orders.length, latest_count);
    for (let i = start; i < orders.length; i++) {
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
        logger.debug("trade_name: " +  order[4].toString());

        let rights = await urb.datas_from_use_right_id(order[0]);
        let use_right_info = rights.form;
        let use_form = {
            "挂单者":  row.provider,
            "购买者":  row.customer,
            "价格(VNET Token)": row.price,
            "购买时间": row.trade_time,
            "续费时间": (row.charging == undefined ? "无" : row.charging),
        }

        logger.form("使用权通证交易信息", use_right_info, use_form);

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
    logger.table(list, title + " (最大显示数量: " + latest_count + ")");
    return list;

}

async function revenue_orders(latest_count, title = "收益权通证交易记录") {
    logger.debug(title);
    let contracts        = await contracts_load();
    let gpu_store        = contracts.GPUStore;
    let revenue_token    = contracts.RevenueToken;
    let vnet_token       = contracts.VNetToken;
    let to               = gpu_store.address;
    let use_right        = contracts.SCPNSUseRightToken;

    let pricision_chain = await use_right.pricision();
    let msgs = [];
    filter = await gpu_store.filters.TradeRevenueTokenEvent(null, null, null);
    filter["fromBlock"] = "earliest";
    filter["toBlock"] = "latest";
    logs = await ethers.provider.getLogs(filter);
    let start = utils.min_from_right(logs.length, latest_count);
    for (let i = start; i < logs.length; i++) {
        log = logs[i];
        logger.debug(log);
        datas = web3.eth.abi.decodeParameters(["uint256", "uint256"], log["data"]);

        let token_id = utils.w3uint256_to_shex(log["topics"][1]);
        let slot     = await revenue_token.slotOf(token_id);
        let vms      = await urb.datas_from_comp_vm_id(slot);
        let vms_info = vms["infos"];
        let event_data = { 
            //blockNumber: log["blockNumber"],
            //blockHash: log["blockHash"],
            //transactionHash: log["transactionHash"],
            "收益权ID": token_id,
            "价格": datas["0"].toString(),
            "挂单者": utils.w3address_to_hex(log["topics"][2]),
            "购买者": utils.w3address_to_hex(log["topics"][3]),
            "时戳": (new Date(Number(datas['1']))).toLocaleString(),
        };
        logger.form("收益权通证信息", vms_info, event_data);
        msgs.push(event_data);
    }
    logger.table(msgs, title + " (最大显示数量: " + latest_count + ")");
}
async function revenue_distribute_revenue(title = "结算记录") {
    logger.debug(title);
    let contracts        = await contracts_load();
    let gpu_store        = contracts.GPUStore;
    let use_right        = contracts.SCPNSUseRightToken;
    let revenue_token    = contracts.RevenueToken;
    let vnet_token       = contracts.VNetToken;
    let to               = gpu_store.address;

    let pricision_chain = await use_right.pricision();
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
            "时戳": (new Date(Number(datas['1']))).toLocaleString(),
        };
        msgs.push(event_data);
    }
    logger.table(msgs, title);
    //msgs.forEach(function(item) {logger.table(item)});
}

async function buy_use(user, use_right_id, title = "购买通证") {
    logger.debug(title);

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let vnet_token       = contracts.VNetToken;
    let to               = gpu_store.address;
    logger.debug("store address: " + gpu_store.address);
    logger.debug("vnet token address: " + vnet_token.address);

    let signer= user.signer;
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

    let amount = 0;
    while(amount < price) {
        amount = await vnet_token.connect(signer).allowance(buyer, gpu_store.address);
    }
    await gpu_store.connect(signer).tradeGPUToken(use_right_id);

    let use_right_info = await _use_right_info_load(use_right_id);
    logger.debug(use_right_info);

    sale_info = {
       "市场":  to,
       "价格(VNet)":  price,
       "挂单者": sale_info[3],
       "购买者": buyer
    };
    logger.form("购买使用权通证信息", use_right_info, sale_info);
}

async function renewal_use_right(user, use_right_id, title = "续费") {
    logger.debug(title);

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let vnet_token       = contracts.VNetToken;
    logger.debug("store address: " + gpu_store.address);
    logger.debug("vnet token address: " + vnet_token.address);

    let signer= user.signer;
    let buyer = await signer.getAddress();
    logger.debug("buyer: " + buyer);

    let list = [];
    let order_id = await gpu_store._gpuTokenIdToOrderId(use_right_id);
    logger.debug("order_id: " + utils.w3uint256_to_hex(order_id));
    let order_info = await gpu_store._orders(order_id);
    let price         = order_info[1].toString();

    logger.debug(order_info);
    list.push({
        use_right_id: use_right_id,
        price: price,
        buyer: buyer
    });

    let is_valid = await use_right.isValid(use_right_id);
    assert(is_valid, "token id(" + use_right_id + ") is invalid.");

    await vnet_token.connect(signer).approve(gpu_store.address, Number(price));

    let amount = 0;
    while(amount < price) {
        amount = await vnet_token.connect(signer).allowance(buyer, gpu_store.address);
    }
    await gpu_store.connect(signer).renewOrder(use_right_id);

    utils.sleep(4);

    let use_right_info = await _use_right_info_load(use_right_id);
    logger.debug(use_right_info);

    sale_info = {
       "费用(VNet)":  price,
       "拥有者": buyer,
       "*续约时间": "30天"
    };
    logger.form("使用权通证续约", use_right_info, sale_info);
    return list;
}

async function approve_use(user, use_right_id, times, title = "授权自动扣费") {
    logger.debug(title);

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let vnet_token       = contracts.VNetToken;
    let to               = gpu_store.address;
    logger.debug("store address: " + gpu_store.address);
    logger.debug("vnet token address: " + vnet_token.address);

    let signer= user.signer;
    let buyer = await signer.getAddress();
    logger.debug("buyer: " + buyer);

    let list = [];
    let order_id = await gpu_store._gpuTokenIdToOrderId(use_right_id);
    logger.debug("order_id: " + utils.w3uint256_to_hex(order_id));
    let order_info = await gpu_store._orders(order_id);
    let price         = order_info[1].toString();

    list.push({
        use_right_id: use_right_id,
        price: price,
        approve: buyer, 
        to: to
    });

    let approve = price * times;
    await vnet_token.connect(signer).approve(gpu_store.address, price);
    let use_right_info = await _use_right_info_load(use_right_id);

    sale_info = {
        "使用权通证ID": use_right_id,
        "授权者":       buyer,
        "被授权者":     to,
        "价格(VNet)":   price,
        "*授权金额(VNet)":  approve,
        "*可扣费次数":  Math.floor(approve / price),
    };
    logger.form("购买使用权通证信息", use_right_info, sale_info);

}

async function reject_use(user, use_right_id, title = "取消自动扣费") {
    logger.debug(title);

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let vnet_token       = contracts.VNetToken;
    let to               = gpu_store.address;
    logger.debug("store address: " + gpu_store.address);
    logger.debug("vnet token address: " + vnet_token.address);

    let signer= user.signer;
    let buyer = await signer.getAddress();
    logger.debug("buyer: " + buyer);

    let list = [];
    let order_id = await gpu_store._gpuTokenIdToOrderId(use_right_id);
    logger.debug("order_id: " + utils.w3uint256_to_hex(order_id));
    let order_info = await gpu_store._orders(order_id);
    let price         = order_info[1].toString();

    list.push({
        use_right_id: use_right_id,
        price: price,
        reject: buyer, 
        to: to
    });

    await vnet_token.connect(signer).approve(gpu_store.address, 0);
    let use_right_info = await _use_right_info_load(use_right_id);

    sale_info = {
        "使用权通证ID": use_right_id,
        "授权者":       buyer,
        "被授权者":     to,
        "价格(VNet)":   price,
        "*授权金额(VNet)":  0,
        "*可扣费次数":  0,
    };
    logger.form("购买使用权通证信息", use_right_info, sale_info);

}
async function put_use(user, use_right_id, title = "添加使用权通证到市场") {
    logger.debug(title);

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let to               = gpu_store.address;
    let market_link      = contracts.SCPNSMarketLink;
    let revenue_token    = contracts.RevenueToken;

    //1.
    let signer = user.signer;
    let owner = await signer.getAddress();

    logger.debug("owner: " + owner);
    logger.debug("to: " + to);
    logger.debug("use_right_id: " + use_right_id);

    //获取使用权通证收益权通证信息
    let revenue_info = await load_revenue_info_by_use_right_id(use_right_id);

    logger.debug(revenue_info.form);

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
       "价格(VNet)":  price,
    };
    logger.debug(sale_info);
    let use_right_info = await _use_right_info_load(use_right_id);
    logger.debug(use_right_info);
    logger.form("出售使用权通证信息", use_right_info, revenue_info.form, sale_info);
}

async function put_revenue(signer, revenue_id) {
    logger.debug("添加收益权通证到市场");

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
    logger.debug("user: " + await signer.getAddress());

    let addr0 = "0x0000000000000000000000000000000000000000";
    let approved = await revenue_token.connect(signer).getApproved(revenue_id);

    if (approved != to) {
        await revenue_token.connect(signer).approve(to, revenue_id);
        while(approved != to) {
            approved = await revenue_token.connect(signer).getApproved(revenue_id);
        }
    }

    let value   = await revenue_token.balanceOf(revenue_id);
    let slot    = await revenue_token.slotOf(revenue_id);
    let revenue_info = {
        "收益权ID" :    utils.w3uint256_to_hex(revenue_id),
        "算力资源ID" :  utils.w3uint256_to_hex(slot),
        "收益权拥有者": "[" + owner.toString() + "]",
        "收益权益值":   "[" + value.toString() + "]",    
    };

    let price = 22000;
    //收益权用户signer发起一个证明任务给指定的算力节点（revenue_id）
    await gpu_store.connect(signer).addRevenueTokenToStore(revenue_id, price);

    let sale_info = {
       "市场":  to,
       "价格(VNet)":  price,
    };
    logger.debug(sale_info);
    logger.form("出售收益权通证信息", revenue_info, sale_info);
}

async function buy_revenue(signer, revenue_id, title = "购买通证") {
    logger.debug(title);

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let gpu_store        = contracts.GPUStore;
    let vnet_token       = contracts.VNetToken;
    let revenue_token    = contracts.RevenueToken;
    let to               = gpu_store.address;
    logger.debug("store address: " + gpu_store.address);
    logger.debug("vnet token address: " + vnet_token.address);

    let buyer = await signer.getAddress();
    logger.debug("buyer: " + buyer);

    let list = [];
    let sale_info = await gpu_store._revenueTokenStore(revenue_id);
    let price         = sale_info[2].toString();
    let slot      = await revenue_token.slotOf(revenue_id);

    logger.debug(sale_info);
    let buy_info = {
        "收益权ID": revenue_id,
        "算力资源ID" :  utils.w3uint256_to_hex(slot),
        "价格(VNet)": price,
        "挂单者": sale_info[3],
        "购买者": buyer
    };
    list.push(buy_info);

    await vnet_token.connect(signer).approve(gpu_store.address, price);

    let amount = await vnet_token.connect(signer).allowance(buyer, gpu_store.address);
    logger.debug("allowance: " + amount.toString());
    while(amount < price) {
        amount = await vnet_token.connect(signer).allowance(buyer, gpu_store.address);
    }
    await gpu_store.connect(signer).tradeRevenueToken(revenue_id);

    logger.form("购买收益权账单", buy_info);

    return list;


}

async function use_right_ids_of(user) {

    let address          = await user.signer.getAddress();
    let alias            = user.alias;
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let use_right_count = await use_right.balanceOf(address);
    logger.debug(alias + " 地址：" + address);

    let list = []
    for (var i = 0; i < use_right_count; i++) {
        let use_right_id = utils.w3uint256_to_hex(await use_right.tokenOfOwnerByIndex(address, i));
        let cvm_id       = utils.w3uint256_to_hex(await use_right.computilityVMIdOf(use_right_id));
        list.push({
            "使用权通证ID": use_right_id,
            "算力资源ID": cvm_id
        });

    }
    logger.table(list, alias + `(${address})拥有的使用权通证`)

    return list;

}

module.exports = {
    filter,
    store_revenue,
    store_use,
    revenues,
    use_orders,
    renewal_use_right,
    revenue_orders,
    revenue_distribute_revenue,
    buy_use,
    put_use,
    approve_use,
    buy_revenue,
    put_revenue,
    select_use_right_id_from_market,
    select_revenue_id,
    use_right_ids_of,
    mint_revenue_or_load_revenue_by_use_right_id,
    load_revenue_info_by_slot,
}
