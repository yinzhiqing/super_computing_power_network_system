const utils     = require("./utils");
const logger    = require("./logger");
const { users,
users_cache_path}  = require("./datas/env.config.js");
const {ethers}     = require("hardhat");
const users_cache  = require(users_cache_path);

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
async function is_changed(user, revenue, vtoken) {
    let cache = get_user(user);
    return !cache.init || (cache.revenue != revenue) || (cache.vtoken != vtoken);
}

async function update_user(user, revenue, vtoken) {
    let cache = get_user(user);
    let block = await ethers.provider.getBlockNumber();
    if (!cache.init) {
        cache.revenue = revenue;
        cache.vtoken  = vtoken.toString();
        cache.init    = true;
        cache.revenue_block = block;
        cache.revenue_date = (new Date()).toLocaleString();
        cache.vtoken_block = block;
        cache.vtoken_date = (new Date()).toLocaleString();
        return cache;
    }

    if (cache.revenue != revenue) {
        cache.revenue_chg = cache.revenue - revenue;
        //'↓'
        cache.revenue_chg_info = (cache.revenue_chg > 0 ? "↓ " : "↑ ") + Math.abs(cache.revenue_chg).toString();
        cache.revenue = revenue;
        cache.revenue_block = block;
        cache.revenue_date = (new Date()).toLocaleString();
    }

    if (cache.vtoken != vtoken) {
        cache.vtoken_chg = web3.utils.toBN(cache.vtoken).sub(web3.utils.toBN(vtoken.toString()));
        logger.debug("votken_chg: " + cache.vtoken_chg);
        logger.debug("vtoken: " + vtoken);
        logger.debug("cache vtoken: " + web3.utils.toBN(cache.vtoken));
        cache.vtoken_chg_info = (cache.vtoken_chg > 0 ? "↓ " : "↑ " ) + Math.abs(cache.vtoken_chg).toString();
        cache.vtoken = vtoken.toString();
        cache.vtoken_block = block;
        cache.vtoken_date = (new Date()).toLocaleString();
    }
    return cache;
}

module.exports = {
    update_cache,
    get_user,
    new_user,
    update_user,
    users_cache,
    is_changed,
}
