// scripts/deploy_upgrade.js
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

AssemblyNotes   = artifacts.require("AssemblyNotes");

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

async function get_contract(name, address) {
    return new web3.eth.Contract(AssemblyNotes["abi"], address)
}
async function read(client, block_number, index, max_count, msgs)
{
    if (max_count <= 0 || block_number <= 0 || index < 0) return [];
    logger.debug("index: " + index);
    logger.debug("block_number : " + block_number);
    pre_block_number = web3.utils.toBN(0);
    await client.getPastEvents("Write", {
        filter: {index: index},
        fromBlock: block_number,
        toBlock: block_number 
    }, function(error, logs) { 
        if(error) {
            logger.error(error);
        } else {
            for (i in logs) {
                log = logs[i];

                rvals = log["returnValues"];

                pre_block_number = rvals["preBlockNumber"];
                let event_data = { 
                    "blockNumber": log["blockNumber"],
                    "blockHash": log["blockHash"],
                    "transactionHash": log["transactionHash"],
                    "timestamp": rvals["timestamp"], 
                    "data": web3.eth.abi.decodeParameter("string", rvals["data"])
                };
                msgs.push(event_data);
            }
        }
    }
    );
    max_count--;
    if (max_count > 0) {
        index--;
        await read(client, pre_block_number, index, max_count, msgs);
    }
}

async function run() {
    logger.debug("start working...", "notes");

    token = tokens["AssemblyNotes"];
    let cobj = await get_contract(token.name, token.address);

    const accounts = await web3.eth.getAccounts();
    block_number = await cobj.methods.lastBlockNumber().call();
    count = await cobj.methods.count().call();

    if (block_number == 0 || count == 0) {
        logger.info("not found logs");
        return;
    }

    msgs = []
    await read(cobj, block_number, count - 1, 10, msgs);
    msgs.forEach(function(item) {logger.table(item)});
}


run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });

