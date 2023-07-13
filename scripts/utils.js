// scripts/deploy_upgradeable_xxx.js
const fs    = require('fs');
const path  = require("path");
const logger    = require("./logger");
const { ethers, upgrades } = require("hardhat");

const ARG_FLG_TXT = "!REF:";
const ARG_VAL_SPLIT = ".";

async function get_contract(name, address) {
    const cf = await ethers.getContractFactory(name);
    const c = await cf.attach(address);
    return c;
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
                throw Error("contract_argument_parse: " + path + " is empty or not found value.");
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

function str_to_web3bytes(data) {
    return web3.eth.abi.encodeParameter("bytes", web3.utils.toHex(data));
}


function w3uint256_to_str(data) {
    return web3.eth.abi.decodeParameter("uint256", web3.utils.toHex(data));
}

function str_to_web3bytes32(data) {
    return web3.eth.abi.encodeParameter("bytes32", web3.utils.toHex(data));
}

function str_to_web3uint256(data) {
    return web3.eth.abi.encodeParameter("uint256", web3.utils.toHex(data));
}

function lstr_to_lweb3bytes32(datas, size) {
    lbytes32 = [];
    start = datas.length;

    for(var i = 0; i < start; i++) {
        lbytes32.push(str_to_web3bytes32(datas[i]));
    }

    for (var i = start; i < size - start; i++) {
        lbytes32.push(str_to_web3bytes32(""));
    }
    return web3.eth.abi.encodeParameter("bytes32[]", lbytes32);
}

module.exports = {
    get_contract,
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
    str_to_web3bytes32,
    str_to_web3bytes,
    lstr_to_lweb3bytes32,
    str_to_web3uint256,
    w3uint256_to_str
}
