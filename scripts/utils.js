// scripts/deploy_upgradeable_xxx.js
const fs        = require('fs');
const path      = require("path");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { ethers, upgrades } = require("hardhat");
const crypto    = require("crypto");
const tokens    = require(prj.contract_conf);
const schedule  = require('node-schedule');

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

function str_to_w3bytes(data) {
    return web3.eth.abi.encodeParameter("bytes", web3.utils.toHex(data));
}

function w3bytes32_to_str(data) {
    return web3.utils.hexToUtf8(web3.eth.abi.decodeParameter("bytes32", data));
}

function w3uint256_to_hex(data) {
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

async function schedule_job(time, func) {
    let times = '\/' + time + '* * * * *';
    //const job = schedule.scheduleJob('/5 * * * * *', func);
    const job = schedule.scheduleJob('/5 * * * *', function(fireDate){
        console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
    });
}

async function scheduleJob(times, func, parameter) {
    while(1) {
        //try {
            if (parameter == null) {
                await func();
            } else {
                await func(parameter)
            }
            
        //} catch {
        //}

        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({ data: 'Hello, World!' });
            }, times * 1000);
        });
    }
}

function min_from_right(value, count) {
    return value > count ? value - count : 0;
}

module.exports = {
    get_contract,
    contract,
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
    strs_to_w3uint256s,
    w3uint256_to_hex,
    w3uint256_to_str,
    w3bytes32_to_str,
    str_to_w3str,
    w3str_to_str,
    json_to_w3str,
    json_to_str,
    hex_to_ascii,
    create_leaf_hash,
    scheduleJob,
    min_from_right 
}
