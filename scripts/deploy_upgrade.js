// scripts/deploy_upgrade.js
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const bak_path  = prj.caches_contracts;
const contract_conf = prj.contract_conf;
const tokens = require(contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function date_format(dash = "-", colon = ":", space = " ") {
    return logger.date_format(dash, colon, space);
}

async function get_contract(name, address) {
    return await utils.get_contract(name, address);
}

async function show_msg(msg, title = "") {
    logger.show_msg(msg, title);
}

async function write_json(filename, data) {
    utils.write_json(filename, data);
}

async function deploy(name, args  = []) {
    const cf = await ethers.getContractFactory(name);
    logger.debug("Deploying " + name + "...  args : " + args);
    const dp = await upgrades.deployProxy(cf, args);
    await dp.deployed();
    logger.info(name + " deployed to: " + dp.address);
    return dp
}

async function upgrade(name, address) {
    const cf = await ethers.getContractFactory(name);
    logger.debug("Upgrading " + name + " address: " + address + " ...");
    const up = await upgrades.upgradeProxy(address, cf);
    logger.info(name + " upgraded");
    return up;
}

async function check_and_deploy(item) {
    let name = item.name;
    let create = item.deploy;
    let params = item.params;
    let address = item.address;
    let dp;

    logger.info("switch: " + item.deploy, "check_and_deploy(" + name + ")")

    if (create) {
        var args = utils.contract_arguments_parse(tokens, params);
        dp = await deploy(name, args);
    } else {
        if (address.length > 0) {
            dp = await get_contract(name, address);
        } else {
            dp = {"address" : address};
        }
    }
    return dp;
}

async function check_and_upgrade(item) {
    let name = item.name;
    let address = item.address;
    let create = item.upgrade;
    let dp;

    logger.info("switch: " + item.upgrade, "check_and_upgrade(" + name + ")")

    if (create) {
        dp = await upgrade(name, address);
    } else {
        if (address.length > 0) {
            dp = await get_contract(name, address);
        } else {
            dp = {"address" : address};
        }
    }
    return dp;
}

async function update_conf(filename) {
    await write_json(filename, tokens);
}

function mkdirs_sync(dirname) {
    return  utils.mkdirs_sync(dirname)
}

async function bak_conf(pathname) {
    let mark = await date_format("", "", "");
    let filename = path.basename(pathname)
    let new_pathname = bak_path + mark + "_" + filename;

    logger.info("save old config to: " + new_pathname , "bak_conf(" + filename + ")");
    data = tokens;
    if (!fs.existsSync(bak_path)) {
        mkdirs_sync(bak_path);
    }
    await write_json(new_pathname, data);
}

async function close_deploy(item, address) {
    if (item.deploy) {
        item.address = address;
        item.deploy = false;
        await update_conf(contract_conf);
    }
}
async function close_upgrade(item) {
    if (item.upgrade) {
        item.upgrade= false;
        await update_conf(contract_conf);
    }
}

async function check_deploy_upgrade_value(item) {
    if (item.deploy == item.upgrade && item.deploy) {
        throw new Error(item.name + " deploy and upgrade is true, only one is true?")
    }
}

async function check_upgrade_value(item) {
    if (item.upgrade && item.address.length <= 0) {
        throw new Error(item.name + " upgrade is true, but address is empty. set address or set upgrade = false")
    }
}

async function check_conf() {
    let has_work = false;
    for(var key in tokens) {
        await check_deploy_upgrade_value(tokens[key]);
        await check_upgrade_value(tokens[key]);
        has_work = has_work || tokens[key].deploy || tokens[key].upgrade;
    }

    if (!has_work) {
        throw Error("config is ok, but all switch is false.")
    }
}

async function run() {
    logger.debug("start working...", "deploy or upgrade");
    await check_conf();
    await bak_conf(contract_conf);
    //logic for token deploy or upgrade
    //d_xxx must have address
    for(var key in tokens) {
        if (tokens[key].fixed) continue;

        logger.debug("processing " + key + "...", "deploy or upgrade");

        const d_sol  = await check_and_deploy(tokens[key]);
        await close_deploy(tokens[key], d_sol.address);

        //u_xxx must have contract 
        const u_sol  = await check_and_upgrade(tokens[key]);
        await close_upgrade(tokens[key]);
    }
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
