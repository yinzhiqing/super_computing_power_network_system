// scripts/deploy_upgradeable_xxx.js
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("../../utils");
const logger    = require("../../logger");
const prj    = require("../../../prj.config.js");
const bak_path  = prj.caches_contracts;
const contract_conf = prj.contract_conf;
const tokens = require(contract_conf);

function write_json(filename, data) {
    utils.write_json(filename, data);
}

function update_conf(filename) {
    write_json(filename, tokens);
}

function close_deploy(item, save = true) {
    if (item.deploy) {
        item.deploy = false;
        if(save) update_conf(contract_conf);
    }
}
function close_upgrade(item, save = true) {
    if (item.upgrade) {
        item.upgrade= false;
        if(save) update_conf(contract_conf);
    }
}

function show_conf() {
    data = tokens;
    logger.table(data, contract_conf)
}

function show_conf_name() {
    logger.info(contract_conf, "file name")
}

function show_tokens() {
    data = token_names();
    logger.table(data, "index tokens")
}

function open_deploy(item, save = true) {
    if (!item.deploy) {
        item.deploy = true;
        if(save) update_conf(contract_conf);
    }
}
function open_upgrade(item, save = true) {
    if (!item.upgrade) {
        item.upgrade= true;
        if(save) update_conf(contract_conf);
    }
}

function close_deploy_with_name(name){
    close_deploy(tokens[name]);
}

function open_deploy_with_name(name) {
    open_deploy(tokens[name]);
}

function close_upgrade_with_name(name){
    close_upgrade(tokens[name]);
}

function open_upgrade_with_name(name) {
    open_upgrade(tokens[name]);
}

function close_all_deploy() {
    let has_work = false;
    for(var key in tokens) {
        close_deploy(items[key], false);
    }
    update_conf(contract_conf);
}

function open_all_deploy() {
    let has_work = false;
    for(var key in tokens) {
        if (!tokens[key].fixed) {
            open_deploy(tokens[key], false);
        }
    }
    update_conf(contract_conf);
}

function close_all_upgrade() {
    let has_work = false;
    for(var key in tokens) {
        close_upgrade(tokens[key], false);
    }
    update_conf(contract_conf);
}

function open_all_upgrade() {
    let has_work = false;
    for(var key in tokens) {
        if (!tokens[key].fixed) {
            open_upgrade(tokens[key], false);
        }
    }
    update_conf(contract_conf);
}

function close_all() {
    close_all_deploy();
    close_all_upgrade();
}

function close_with_name(name) {
    close_deploy(tokens[name], false);
    close_upgrade(tokens[name], false);
    update_conf(contract_conf);
}

function create_open_script(token, type="deploy", always = false, basepath = "") {
    let filename = path.join(basepath, "open_" + type +"_" + token + ".js");
    let script = "const switchs = require(\"./deploy_upgrade_swith.js\");\nswitchs.open_" + type + "_with_name(\"" + token + "\");";
    if (!utils.file_exists(filename) || always) {
        logger.debug("create_open_script: " + filename);
        utils.write_datas(filename, script);
    }
}

function create_open_all_script(type="deploy", always = false, basepath = "") {
    let filename = path.join(basepath, "open_" + type +"_all.js");
    let script = "const switchs = require(\"./deploy_upgrade_swith.js\");\nswitchs.open_all_" + type + "();";
    if (!utils.file_exists(filename) || always) {
        logger.debug("create_open_script: " + filename);
        utils.write_datas(filename, script);
    }
}

function create_close_script(token, type="deploy", always = false, basepath = "") {
    let filename = path.join(basepath,  "close_" + type + "_all.js");
    let script = "const switchs = require(\"./deploy_upgrade_swith.js\");\nswitchs.close_" + type + "_with_name(\"" + token + "\");";
    if (!utils.file_exists(filename) || always) {
        logger.debug("create_close_script: " + filename);
        utils.write_datas(filename, script);
    }
}

function create_close_all_script(type="deploy", always = false, basepath = "") {
    let filename = path.join(basepath,  "close_" + type + "_all.js");
    let script = "const switchs = require(\"./deploy_upgrade_swith.js\");\nswitchs.close_all_" + type + "();";
    if (!utils.file_exists(filename) || always) {
        logger.debug("create_close_script: " + filename);
        utils.write_datas(filename, script);
    }
}

function create_token_script(token, type="deploy", basepath = "./", always = false) {
    if (basepath != undefined && !path.isAbsolute(basepath)) {
        basepath = path.join(__dirname, basepath);
    }
    create_open_script(token, type, always, basepath);
    create_close_script(token, type, always, basepath);
}

function create_tokens_script(type="deploy", basepath = "./", always = false) {
    if (basepath != undefined && !path.isAbsolute(basepath)) {
        basepath = path.join(__dirname, basepath);
    }
    create_open_all_script(type, always, basepath);
    create_close_all_script(type, always, basepath);
}

function token_names() {
    let names = new Array();
    for(var token in tokens) {
        if (!tokens[token].fixed) {
            names.push(token);
        }
    }
    return names;
}
module.exports = {
    close_all,
    close_with_name,
    close_deploy_with_name,
    open_deploy_with_name,
    open_all_deploy,
    close_upgrade_with_name,
    close_all_upgrade,
    open_upgrade_with_name,
    open_all_upgrade,
    show_conf,
    show_conf_name,
    show_tokens,
    create_token_script,
    create_tokens_script,
    token_names
}
