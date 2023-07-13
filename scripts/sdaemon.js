// scripts/deploy_upgrade.js
const fs        = require('fs');
const sleep     = require('sleep');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const dbs       = prj.dbs;
const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const token = tokens["ViolasNft721"];
const {ethers, upgrades}    = require("hardhat");

const redis = require("redis");

async function get_contract(name, address) {
    return await utils.get_contract(name, address);
}

async function show_accounts() {
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts);
}

async function grant_role(address, role) {
    logger.debug("start working...", "grant_role");
    let cobj = await get_contract(token.name, token.address);
    let has = await has_role(address, role);
    if (has != true) {
        logger.info("grant role :" +  role + " for " + address);
        let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
        await cobj.grantRole(brole, address);
        await has_role(address, role);
    } else {
        logger.info(address + " had role: " +  role);

    }
}

async function has_role(address, role) {
    //    let brole = web3.eth.abi.encodeParameter("bytes32", role);
    let brole = web3.eth.abi.encodeParameter("bytes32", web3.utils.soliditySha3(role));
    let cobj = await get_contract(token.name, token.address);
    let has = await cobj.hasRole(brole, address);
    logger.info(address + " check role(" + role + ") state: " + has);

    return has;
}

async function grant_minter(address) {
    logger.debug("start grant minter...", "role opt");
    let role = "MINTER_ROLE";

    let has = await has_role(address, role);
    if (has) {
        logger.debug("had minter role");
    } else {
        await grant_role(address, role);
    }
}


async function run() {
    logger.debug("start working...", "role opt");
    //await show_accounts();

    const accounts = await web3.eth.getAccounts();

    let personal_index = 1;
    let personal = accounts[personal_index];
    let platform = accounts[2];

    let roleconf = dbs.role;
    let host = "127.0.0.1";
    let port = 6379;
    if (roleconf) {
        host = roleconf.host;
        port = Number(roleconf.port);
    }
    logger.debug("connect db: " + host + " port: " + port)
    var client = redis.createClient(port, host);
    //client.auth(123457);
    await client.connect();
    await client.select(1);
    while(1) {
        let last = await client.get("last");
        logger.debug("last = " + last);
        for(let i = 0; i < last; i++) {
            try {
                var kexists =  await client.exists(i.toString());
                if (kexists) {
                    var address = await client.get(i.toString());
                    kexists =  await client.exists(i.toString());
                    if (kexists) {
                        var state = await client.get(address);
                        if (state == 1) {
                            continue;
                        }
                    }
                    await grant_minter(address);
                    await client.set(address, 1);
                } else {
                    logger.warning("not found key: " + i);
                }
            } catch (e) {
                logger.error("error: " + e.message);
            }

        }
        sleep.sleep(3);
    }

}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
