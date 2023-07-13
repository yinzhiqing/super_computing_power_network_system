const path = require("path");
const hardhat_conf= require("./hardhat.config.js");

configs = {
    defaultNetwork : hardhat_conf.defaultNetwork,
    datas_path : "./datas",
    networks : {
        localhost: {
            contracts:"./jsons/contracts/contract_localhost.json",
        },
        internal: {
            contracts:"./jsons/contracts/contract_internal.json",
        },
        external: {
            contracts:"./jsons/contracts/contract_external.json",
        },
        mainnet: {
            contracts:"./jsons/contracts/contract_mainnet.json",
        },
    },
    dbs: {
        role: {
            host: "127.0.0.1",
            port: "6377",
        },
    },
};

function conf_filename(name) {
    filename = configs["networks"][configs.defaultNetwork][name];
    if (filename == undefined || path.isAbsolute(filename)) {
        return filename;
    }

    var pathname =  path.join(__dirname, configs["networks"][configs.defaultNetwork][name]);
    return pathname;
}
function contract_conf() {
    return conf_filename("contracts");
}

function caches(type) {
    if (configs.datas_path.length == 0) {
        configs.datas_path = ".";
    }
    return configs.datas_path + "/" + type + "/" + configs.defaultNetwork + "/";
}
module.exports = {
    configs,
    network : configs.defaultNetwork,
    contract_conf : conf_filename("contracts"),
    caches_contracts : caches("contracts"),
    dbs: configs.dbs,
};

