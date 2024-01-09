// scripts/deploy_upgradeable_xxx.js
const fs        = require('fs');
const path      = require("path");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { ethers, upgrades } = require("hardhat");
const crypto    = require("crypto");
const tokens    = require(prj.contract_conf);
const schedule  = require('node-schedule');
const env       = require("./datas/env.config.js");
const users      = env.users;

const ARG_FLG_TXT = "!REF:";
const ARG_VAL_SPLIT = ".";

async function get_contract(name, address) {
    const cf = await ethers.getContractFactory(name);
    const c = await cf.attach(address);
    return c;
}

async function contract(name) {
    let token = tokens[name];
    return await get_contract(token.name, token.address);
}

async function contract_ext(abi, address) {
    return await ethers.getContractAt(abi, address);
}

async function has_role(cobj, address, role) {
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    return await cobj.hasRole(brole, address);
}

function get_files(pathname, ext) {
    let file_names = new Array();
    let files = fs.readdirSync(pathname)
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        stat = fs.statSync(path.join(pathname, file));
        if (stat.isFile()) {
            if (ext != undefined) {
                if (path.extname(path.join(pathname + file)) === ext) {
                    file_names.push(file);
                } 
            } else {
                file_names.push(file);
            }
        }
    }

    return file_names;
}

function write_datas(filename, data) {
    if (fs.existsSync(filename)) {
        fs.writeFileSync(filename, data);
    } else {
        fs.writeFileSync(filename, data);
    }
    return true;
}

function file_exists(filename) {
    return fs.existsSync(filename);
}

function write_json(filename, data) {
    save_data = JSON.stringify(data, null, "\t");
    return write_datas(filename, save_data);
}
function mkdirs_sync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirs_sync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

function filename_parse(filename) {
    return {
        dirname:    path.dirname(filename),
        basename:   path.basename(filename),
        extname:    path.extname(filename),
        change_ext: function(ext) {
            return path.join(this.dirname, path.basename(this.basename, this.extname) + ext);
        }
    }
}

function filename_join(path, filename) {
    return path.join(path, filename);
}

function filename_change_ext(filename, ext) {
}

function arg_is_parse(arg) {
    return arg && arg.startsWith(ARG_FLG_TXT);
}

function args_is_parse(args) {
    if (args.length > 0 && Array.isArray(args)) {
        for (i in args) {
            arg = args[i];
            if(arg.startsWith(ARG_FLG_TXT)) {
                return true;
            }
        }
    }
    return false;
}

function contract_argument_parse(json, arg) {
    if (arg_is_parse(arg)) {
        value = arg.substr(ARG_FLG_TXT.length);
        keys = value.split(ARG_VAL_SPLIT);
        data = json;
        var path = "";
        for(i in keys) {
            var key = keys[i];
            data = data[key];
            path += key;
            if (!data) {
                continue;
                //throw Error("contract_argument_parse: " + path + " is empty or not found value.");
            }
            path += ARG_VAL_SPLIT;
        }
        return data;
    }
    return arg;
}

function contract_arguments_parse(json, args) {
    var new_args = [];
    if (args_is_parse(args)) {
        for (i in args) {
            arg = args[i];
            new_arg = contract_argument_parse(json, arg);
            new_args.push(new_arg);
        }
        return new_args;
    }
    return args;
}

function json_to_w3str(data) {
    return str_to_w3str(JSON.stringify(data));
}

function json_to_str(data) {
    return JSON.stringify(data);
}

function str_to_w3str(data) {
    return web3.eth.abi.encodeParameter("string", data);
}

function w3str_to_str(data) {
    return web3.eth.abi.decodeParameter("string", data);
}

function w3address_to_hex(data) {
    return web3.eth.abi.decodeParameter("address", data);
}

function hex_to_address(data) {
    return web3.eth.abi.encodeParameter("address", data);
}

function str_to_w3bytes(data) {
    return web3.eth.abi.encodeParameter("bytes", web3.utils.toHex(data));
}

function w3bytes32_to_str(data) {
    return web3.utils.hexToUtf8(web3.eth.abi.decodeParameter("bytes32", data));
}

function w3uint256_to_hex(data) {
    return web3.utils.toHex(data.toString());
}

function w3uint256_to_shex(data) {
    data = web3.eth.abi.decodeParameter("uint256", web3.utils.toHex(data));
    return web3.utils.toHex(data.toString());
}

function w3uint256_to_str(data) {
    return data.toString();
}

function w3uint256_to_number(data) {
    return Number(data.toString());
}

function str_to_w3bytes32(data) {
    return web3.eth.abi.encodeParameter("bytes32", web3.utils.toHex(data));
}

function str_to_w3uint256(data) {
    return web3.eth.abi.encodeParameter("uint256", web3.utils.toHex(data));
}

function strs_to_w3uint256s(data) {
    return web3.eth.abi.encodeParameter("uint256[]", data);
}

function strs_to_w3strs(data) {
    return web3.eth.abi.encodeParameter("string[]", data);
}
function lstr_to_lweb3bytes32(datas, size) {
    lbytes32 = [];
    start = datas.length;

    for(var i = 0; i < start; i++) {
        lbytes32.push(str_to_w3bytes32(datas[i]));
    }

    for (var i = start; i < size - start; i++) {
        lbytes32.push(str_to_w3bytes32(""));
    }
    return web3.eth.abi.encodeParameter("bytes32[]", lbytes32);
}

/*
 * sha256
 *
 * @parameter data hex string(0x start)
 *
 * @return hex string(0x start)
 *
 */
function bytes_sha256(data) {
    sha256 = crypto.createHash("sha256");
    data = web3.utils.hexToBytes(data);
    return "0x" + sha256.update(Buffer.from(data)).digest("hex");
}
function create_leaf_hash(dynamicData, index, deep) {
    let hash = web3.eth.abi.encodeParameters(["bytes32", "uint256"], [dynamicData, index]);
    for (var i = 0; i < deep; i++) {
        hash = bytes_sha256(hash);
    }
    return str_to_w3bytes32(hash);
}

function hex_to_ascii(data) {
    return web3.utils.hexToAscii(data);
}

function time_s_to_dhms(value) {
    let min_sec   = 60; 
    let hour_sec  = 60 * min_sec;
    let day_sec   = 24 * hour_sec;
    let days      = Math.floor(value/ day_sec);
    let hours     = Math.floor((value - day_sec * days) / hour_sec);
    let mins      = Math.floor((value - day_sec * days - hours * hour_sec) / min_sec);
    let secs      = value - day_sec * days - hours * hour_sec - mins * min_sec;

    let date_str = "";
    date_str = days > 0 ? days + "天" : "";
    date_str += (hours > 0 ? hours + "小时" : "");
    date_str += (mins > 0 ? mins + "分" : "");
    date_str += (secs + "秒");

    return date_str;
}

async function schedule_job(time, func) {
    let times = '\/' + time + '* * * * *';
    //const job = schedule.scheduleJob('/5 * * * * *', func);
    const job = schedule.scheduleJob('/5 * * * *', function(fireDate){
        console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
    });
}

/**
 * @notice 循环执行
 * @param times 间隔时间
 * @param func  要执行的参数
 * @param parameter func 参数
 * @param clear true：清空控制台 
 * @param reset_buf: 清空buf周期（秒）
 *
 *
 */
async function scheduleJob(times, func, parameter, clear, reset_buf) {
    assert(typeof(func ) == "function", "scheduleJob: parameter(func) must be function");

    let starttime = Date.now();
    
    while(1) {
        try {
            if (reset_buf != undefined && reset_buf > 0 && Date.now() - starttime > reset_buf * 1000) {
                switch(typeof(parameter)) {
                    case "number": {
                        logger.debug("number");
                        break;
                    }
                    case "string": {
                        logger.debug("string");
                        break;
                    }
                    case "boolean": {
                        logger.debug("boolean");
                        break;
                    }
                    case "object": {
                        logger.debug("object");
                        break;
                    }
                    case "other" : {
                        logger.debug("other");
                        break;
                    }

                }
                if(Array.isArray(parameter)) {
                    for(let i in parameter) {
                        if(typeof(parameter[i]) == "object" && parameter[i].alias == undefined) {
                            parameter[i] = {};
                        }
                    }
                } else {

                }

                starttime = Date.now();
            }
            if (clear == true) {
                console.clear();
            }
            if (parameter == null) {
                await func();
            } else {
                //await func(parameter)
                await func.apply(null, parameter);
            }
            
        } catch(error) {
            logger.warning(error);
        }

        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({ data: 'Hello, World!' });
            }, times * 1000);
        });
    }
}

async function sleep(times) {
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({ data: 'Hello, World!' });
        }, times * 1000);
    });
}

function min_from_right(value, count) {
    return value > count ? value - count : 0;
}

function to_full_path(dirname, subdir, name) {
   return path.join(dirname ,  subdir, name);
}
module.exports = {
    users,
    get_contract,
    contract,
    contract_ext,
    file_exists,
    write_json,
    write_datas,
    mkdirs_sync,
    get_files,
    filename_change_ext,
    filename_join,
    filename_parse,
    contract_arguments_parse,
    contract_argument_parse,
    str_to_w3bytes32,
    str_to_w3bytes,
    lstr_to_lweb3bytes32,
    str_to_w3uint256,
    strs_to_w3strs,
    strs_to_w3uint256s,
    w3uint256_to_hex,
    w3uint256_to_shex,
    w3uint256_to_str,
    w3uint256_to_number,
    w3bytes32_to_str,
    w3address_to_hex,
    hex_to_address,
    str_to_w3str,
    w3str_to_str,
    json_to_w3str,
    json_to_str,
    hex_to_ascii,
    create_leaf_hash,
    scheduleJob,
    min_from_right,
    time_s_to_dhms,
    sleep,
    to_full_path,
    has_role,
}
