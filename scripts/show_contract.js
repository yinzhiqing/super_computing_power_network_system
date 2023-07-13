// scripts/index.js
const prompt    = require('prompt');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const contract_conf = prj.contract_conf;
const tokens  = require(prj.contract_conf);

async function get_contract(name, address) {
    return await utils.get_contract(name, address);
}

async function show_msg(msg, title = "") {
    logger.show_msg(msg, title, {"format": false, "type": "table"});
}

async function chain_env() {
    let sdatas = {
        network:    await ethers.provider.getNetwork(),
    }
    show_msg(sdatas, "chain");
}

async function account_info() {
    const accounts = await ethers.provider.listAccounts();

    let sdatas = {};
    for(let i = 0; i < accounts.length; i++) {
        sdatas[accounts[i]] = (await ethers.provider.getBalance(accounts[i])).toString();
    }
    show_msg(sdatas, "accounts");
}

function is_target_name(token_name) {
    let target_token_name = "";
    return (target_token_name == "" || target_token_name == token_name) && token_name != "";
}

async function tokens_env() {
    for (var token_name in tokens) {
        if (!is_target_name(token_name)) continue;

        logger.debug("#contract name: " + token_name);
        token = tokens[token_name];
        await token_env(token);
    }
}
async function token_env(token) {
    let cobj = await get_contract(token.name, token.address);
    let sdatas = {
        name: token.name,
        contractname: await cobj.name(),
        contractsymbol: await cobj.symbol(),
        contractAddress: token.address,
    }
    show_msg(sdatas, token.name);
}

async function run_fix() {

    await tokens_env();
}

async function run() {
    logger.debug("start working...", "chain contract");
    await chain_env();
    await account_info();
    await tokens_env();
}

run()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
