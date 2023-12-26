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
const gs_abi    = require("./datas/abis/GPUStore.json");
const rt_abi    = require("./datas/abis/RevenueToken.json");
const {abi}     = require("./datas/abis/IERC20Upgradeable.json");
const erc20_abi = abi;
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

async function contracts_load() {
    let dns              = await contract("SCPNSDns");
    let to               = await dns.addressOf("GPUStore");
    let gpu_store        = await contract_ext(gs_abi, to);
    let vnet_token       = await contract_ext(erc20_abi, await gpu_store._paymentToken());
    return {
        SCPNSDns:               await contract("SCPNSDns"),
        SCPNSComputilityUnit:   await contract("SCPNSComputilityUnit"),
        SCPNSComputilityVM :    await contract("SCPNSComputilityVM"),
        SCPNSProofTask:         await contract("SCPNSProofTask"),
        SCPNSUseRightToken:     await contract("SCPNSUseRightToken"),
        SCPNSGpuList:           await contract("SCPNSGpuList"),
        SCPNSComputilityRanking:await contract("SCPNSComputilityRanking"),
        SCPNSProofParameter:    await contract("SCPNSProofParameter"),
        SCPNSTypeUnit:          await contract("SCPNSTypeUnit"),
        SCPNSTypeRevenue:       await contract("SCPNSTypeRevenue"),
        SCPNSVerifyTask:        await contract("SCPNSVerifyTask"),
        SCPNSMarketLink:        await contract("SCPNSMarketLink"),
        GPUStore:               await contract_ext(gs_abi, await (await contract("SCPNSDns")).addressOf("GPUStore")),
        VNetToken:              await contract_ext(erc20_abi, await gpu_store._paymentToken()),
        RevenueToken:           await contract_ext(rt_abi, await gpu_store._revenueToken()),
    };
}

module.exports = {
    contracts_load
}
