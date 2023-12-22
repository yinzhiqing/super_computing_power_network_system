const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const gs_abi    = require("./datas/abis/GPUStore.json");
const vnet_abi    = require("./datas/abis/IERC20Upgradeable.json");
const sur       = require("./show_use_rights_base.js");
const { users, 
    users_cache_name }   = require("./datas/env.config.js");
const users_cache_path   = path.join(__dirname ,  "/datas/" , users_cache_name);
const users_cache        = require(users_cache_path);
const { contracts_load } = require("./contracts.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

function update_cache() {
    utils.write_json(users_cache_path, users_cache);
}

function get_user(user) {
    return new_user(user);
}
function new_user(user) {
    if (users_cache[user] == undefined) {
        users_cache[user] = {
            init: false,
            revenue:     0,
            revenue_chg: 0,
            revenue_chg_info: "",
            vtoken:      0,
            vtoken_chg:  0,
            vtoken_chg_info:  ""
        }
    }
    return users_cache[user];
}

function update_user(user, revenue, vtoken) {
    let cache = get_user(user);
    if (!cache.init) {
        cache.revenue = revenue;
        cache.vtoken  = vtoken;
        cache.init    = true;

        return cache;
    }

    if (cache.revenue != revenue) {
        cache.revenue_chg = cache.revenue - revenue;
        //'↓'
        cache.revenue_chg_info = (cache.revenue_chg > 0 ? "↓ " : "↑ ") + Math.abs(cache.revenue_chg).toString();
        cache.revenue = revenue;
    }

    if (cache.vtoken != vtoken) {
        cache.vtoken_chg = cache.vtoken - vtoken;
        cache.vtoken_chg_info = (cache.vtoken_chg > 0 ? "↓ " : "↑ " ) + Math.abs(cache.vtoken_chg).toString();
        cache.vtoken = vtoken;
    }
    return cache;
}

async function works() {
    logger.info("账户金额");

    //获取合约SCPNSProofTask对象
    let contracts        = await contracts_load();
    let use_right        = contracts.SCPNSUseRightToken;
    let dns              = contracts.SCPNSDns;
    let to               = await dns.addressOf("GPUStore");
    let gpu_store        = contracts.GPUStore;
    let vnet_token       = contracts.VNetToken;
    let revenue_token    = contracts.RevenueToken;
    logger.debug("vnet token address: " + vnet_token.address);
    let list  = [];
    let merge_users = {};

    for (let i in users) {
        let account = users[i].signer;
        let addr = await users[i].signer.getAddress();
        merge_users[addr] = {
            alias: (merge_users[addr] == undefined ? "" : merge_users[addr]["alias"]+ ", ") + users[i].alias,
            revenue_count: 0,
        };
    }
    
    let other_address = [
        {alias: "市场", address: gpu_store.address},
    ]

    for (let i in other_address) {
        let addr = await other_address[i].address;
        merge_users[addr] = {
            alias: (merge_users[addr] == undefined ? "" : merge_users[addr].alias + ", ") + other_address[i].alias,
            revenue_count: 0,
        };
    }

    let total = await revenue_token.totalSupply();
    let total_value = 0;
    for (let i = 0; i < total; i++) {
        let token_id = await revenue_token.tokenByIndex(i);
        let owner   = await revenue_token.ownerOf(token_id);

        let slot    = await revenue_token.slotOf(token_id);
        let value   = await revenue_token.balanceOf(token_id);
        total_value += Number(value);
        if (merge_users[owner] != undefined) {
            merge_users[owner].revenue_count += Number(value);
        }
    }

    for (let key in merge_users) {
        let revenue = merge_users[key].revenue_count;
        let vtoken  = (await vnet_token.balanceOf(key)).toString();

        let user    = update_user(key, revenue, vtoken);
        list.push({
            "账户地址": key,
            "账户类型": merge_users[key].alias,
            "收益权值": revenue + "/" + total_value,
            "收益权值变动": user.revenue_chg_info,
            "账户资金": vtoken,
            "账户资金变动": user.vtoken_chg_info,
        })
    }

    logger.table(list);
    update_cache();
}

async function run(times) {
    let buf = {};
    //await utils.scheduleJob(times, works, buf, true);
    await works();
}
run(3)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
