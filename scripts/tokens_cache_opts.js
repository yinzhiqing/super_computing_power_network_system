
const utils     = require("./utils");
const logger    = require("./logger");
const { tokens_cache_path}  = require("./datas/env.config.js");
const {ethers}      = require("hardhat");
const tokens_cache  = require(tokens_cache_path);

function update_cache() {
    utils.write_json(tokens_cache_path, tokens_cache);
}

function update_token_id(name, value, usage) {
    tokens_cache[name] = {
            "use": usage,
            "value": value
    };
    update_cache();
}
function get_token_id(name) {
    if (tokens_cache[name] != null 
        && tokens_cache[name] != undefined
        && tokens_cache[name].use == true) {
        return tokens_cache[name]["value"];
    }
    return null;
}

module.exports = {
    update_cache,
    fixed_use_right_id: get_token_id("fixed_use_right_id"),
}
