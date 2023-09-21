const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const abi       = require("../artifacts/contracts/interface/ISCPNSVerifyTask.sol/ISCPNSVerifyTask.json");

const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

var url_rpc= `http://124.251.110.238/rpc`;
var url_ws= `http://106.14.38.214:6060`;
var Web3 = require('web3');
//var web3 = new Web3(new Web3.providers.WebsocketProvider('http://127.0.0.1:8545'));
//var web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider(url_ws));
//var web3 = new Web3(Web3.givenProvider ||  url_rpc);
 

web3.eth.getChainId().then(console.log);
var subscription = web3.eth.subscribe('logs', {
    address: [tokens['SCPNSProofTask'].address, tokens['SCPNSVerifyTask'].address]
}, function(error, result){
    if (!error)
        console.log(result);
    logger.warning("time: " + Math.floor(((new Date()).getTime())));
});

// unsubscribes the subscription
subscription.unsubscribe(function(error, success){
    if(success)
        console.log('Successfully unsubscribed!');
});
