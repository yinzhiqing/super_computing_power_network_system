const utils     = require("./utils");
const logger    = require("./logger");
const { users } = require("./datas/env.config.js");
const { uco }   = require("./cache_opts.js");
const {ethers}  = require("hardhat");
const { contracts_load } = require("./contracts.js");

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
            revenue: 0,
        };
    }
    
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
        }
    }

    let block = await ethers.provider.getBlockNumber();
    for (let key in merge_users) {
        let revenue = merge_users[key].revenue;
        let vtoken  = (await vnet_token.balanceOf(key));

        let user    = await uco.update_user(key, revenue, vtoken);
        list.push({
            "账户地址": key,
            "账户类型": merge_users[key].alias,
            "收益权值": revenue + "/" + total_value,
            "收益权值变动": user.revenue_chg_info,
            //"收益权值保持时间": utils.time_s_to_dhms((block - user.revenue_block) * 2),
            "收益权值变更时间": user.revenue_date,
            "账户资金": vtoken.toString(),
            "账户资金变动": user.vtoken_chg_info,
            //"账户资金保持时间": utils.time_s_to_dhms((block - user.vtoken_block) * 2),
            "账户资金变更时间": user.vtoken_date,
        })
    }

    logger.table(list);
    uco.update_cache();
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
