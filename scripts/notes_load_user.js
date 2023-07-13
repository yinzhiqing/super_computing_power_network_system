// scripts/deploy_upgrade.js
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function get_contract(name, address) {
    return await utils.get_contract(name, address);
}

async function has_role(client, address) {
    let role= await client.WRITER_ROLE();
    let has = await client.hasRole(role, address);
    logger.info(address + " check role(" + role + ") state: " + has);

    return has;
}

async function read(client, address, block_number, index, max_count, msgs)
{
    if (max_count <= 0 || block_number <= 0 || index < 0) return [];
    filter = await client.filters.Write(address, null, index);
    filter["fromBlock"] = "earliest";
    filter["toBlock"] = "latest";
    logs = await ethers.provider.getLogs(filter);
    pre_block_number = web3.utils.toBN(0);
    for (i in logs) {
        log = logs[i];
        data = log["data"];

        datas = web3.eth.abi.decodeParameters(["uint256", "uint256", "string"], data);
        pre_block_number = web3.utils.toBN(datas["0"]);
        let event_data = { 
            "blockNumber": log["blockNumber"],
            "blockHash": log["blockHash"],
            "transactionHash": log["transactionHash"],
            "timestamp": datas["1"], 
            "data": web3.eth.abi.decodeParameter("string", datas["2"])
        };
        msgs.push(event_data);
    }

    max_count--;
    if (max_count > 0) {
        index--;
        await read(client, address, pre_block_number.toNumber(), index, max_count, msgs);
    }
}

async function run() {
    logger.debug("start working...", "notes");

    token = tokens["AssemblyNotes"];
    let cobj = await get_contract(token.name, token.address);

    const accounts = await web3.eth.getAccounts();
    //sender address
    address = accounts[0];

    //write()
    block_number = await cobj.preBlockNumberOf(address);
    count = await cobj.countOf(address);

    if (block_number == 0 || count == 0) {
        logger.info("not found logs");
        return;
    }

    msgs = []
    await read(cobj, address, block_number.toNumber(), count - 1, 10, msgs);
    msgs.forEach(function(item) {logger.table(item)});
}


run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });

