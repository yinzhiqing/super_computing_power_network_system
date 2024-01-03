const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const gs_abi    = require("./datas/abis/GPUStore.json");
const vnet_abi    = require("./datas/abis/IERC20Upgradeable.json");
const sur       = require("./use_rights_base.js");
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
            revenue_block: 0,
            vtoken:      0,
            vtoken_chg:  0,
            vtoken_chg_info:  "",
            vtoken_block: 0,
        }
    }
    return users_cache[user];
}

async function update_user(user, revenue, vtoken) {
    let cache = get_user(user);
    let block = await ethers.provider.getBlockNumber();
    if (!cache.init) {
        cache.revenue = revenue;
        cache.vtoken  = vtoken.toString();
        cache.init    = true;
        cache.revenue_block = block;
        cache.vtoken_block = block;
        return cache;
    }

    if (cache.revenue != revenue) {
        cache.revenue_chg = cache.revenue - revenue;
        //'↓'
        cache.revenue_chg_info = (cache.revenue_chg > 0 ? "↓ " : "↑ ") + Math.abs(cache.revenue_chg).toString();
        cache.revenue = revenue;
        cache.revenue_block = block;
    }

    if (cache.vtoken != vtoken) {
        cache.vtoken_chg = web3.utils.toBN(cache.vtoken).sub(web3.utils.toBN(vtoken.toString()));
        logger.debug("votken_chg: " + cache.vtoken_chg);
        logger.debug("vtoken: " + vtoken);
        logger.debug("cache vtoken: " + web3.utils.toBN(cache.vtoken));
        cache.vtoken_chg_info = (cache.vtoken_chg > 0 ? "↓ " : "↑ " ) + Math.abs(cache.vtoken_chg).toString();
        cache.vtoken = vtoken.toString();
        cache.vtoken_block = block;
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
 
    //初始化配置文件中的用户
    for (let i in users) {
        let account = users[i].signer;
        let addr = await users[i].signer.getAddress();
        merge_users[addr] = {
            alias: (merge_users[addr] == undefined ? "" : merge_users[addr]["alias"]+ ", ") + users[i].alias,
            revenue: 0,
        };
    }
    
    //添加已知用户
    let other_address = [
        {alias: "市场", address: gpu_store.address},
    ]

    for (let i in other_address) {
        let addr = await other_address[i].address;
        merge_users[addr] = {
            alias: (merge_users[addr] == undefined ? "" : merge_users[addr].alias + ", ") + other_address[i].alias,
            revenue: 0,
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
            merge_users[owner].revenue += Number(value);
        } else {
            //添加其它user
            merge_users[addr] = {
                alias: "其它收益账户",
                revenue: Number(value),
            };
        }
    }

    let block = await ethers.provider.getBlockNumber();
    for (let key in merge_users) {
        let revenue = merge_users[key].revenue;
        let vtoken  = (await vnet_token.balanceOf(key));

        let user    = await update_user(key, revenue, vtoken);
        list.push({
            "账户地址": key,
            "账户类型": merge_users[key].alias,
            "收益权值": revenue + "/" + total_value,
            "收益权值变动": user.revenue_chg_info,
            "收益权值保持时间(秒)": utils.time_s_to_dhms((block - user.revenue_block) * 2),
            "账户资金": vtoken.toString(),
            "账户资金变动": user.vtoken_chg_info,
            "账户资金保持时间(秒)": utils.time_s_to_dhms((block - user.vtoken_block) * 2),
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
