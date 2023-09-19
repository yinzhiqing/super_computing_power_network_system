
const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle    = require("./merkle");
const cryptojs  = require("crypto-js");
const crypto    = require("crypto");
const {defaultAbiCoder} = require('@ethersproject/abi');
const {hexToBytes}= require('ethereum-cryptography/utils');

const bak_path  = prj.caches_contracts;
const tokens  = require(prj.contract_conf);
const {ethers, upgrades}    = require("hardhat");

// 随机选择一个叶子对应的数据值hash
async function create_q(dynamicData, leaf_count, leaf_deep) {

    logger.table({dynamicData: dynamicData, leaf_count: leaf_count, leaf_deep: leaf_deep}, "create merkle tree")
    //create merkle
    let leaf = merkle.get_leaf(leaf_count/2, dynamicData, leaf_count, leaf_deep);
    logger.info("leaf : " + leaf);
    return leaf;
}

/*
 * 此函数描述了挑战者发起挑战的代码调用过程.
 *
 * 挑战者对可以接受挑战的算力节点发起挑战，
 * 挑战方式是给定算力节点一个叶子hashp值，
 * 在有限的时间内，
 * 被挑战（算力节点）者需要回答叶子hash对应的路径
 *
 */

async function crate_merge_data() {
    var dynamicData = "0x0dd9fe0e2c33052886b7e30285180c63b44900f60f94f65c24bd29c6f40f377d";
    var leaf_index = 512;
    var hex_data = defaultAbiCoder.encode(['bytes32', 'uint256'], [dynamicData, leaf_index]);
    console.log('hex_data: ', hex_data);
}

async function test_sha256() {
    var dynamicData = "0x0dd9fe0e2c33052886b7e30285180c63b44900f60f94f65c24bd29c6f40f377d";
    var leaf_count = 1024;
    var leaf_deep  = 10;
    var leaf_index = 512;

    console.log("\n基础参数----->\n");
    console.log("   dynamicData                    :", dynamicData);
    console.log("   leaf_index                     :", leaf_index);
    console.log("\n基础参数编码后-----> \n");
    console.log("   dynamicData_encode_bytes32     :", web3.eth.abi.encodeParameter("bytes32", dynamicData));
    console.log("   leaf_index_encode_uint32       :", web3.eth.abi.encodeParameter("uint256", leaf_index));

    console.log("\n参数合并值----> \n");
    var dynamicData_index_encode = web3.eth.abi.encodeParameters(["bytes32", "uint256"], [dynamicData, leaf_index]);
    console.log("dynamicData_index_encode          :", dynamicData_index_encode);


    console.log("\n参数合并后sha256值----> \n");

    obj = crypto.createHash("sha256");

    console.log("\nsha256输入hex----> \n");
    console.log("dynamicData_index_encode_hex      :", dynamicData_index_encode);
    dynamicData_index_encode_sha256 = obj.update(Buffer.from(dynamicData_index_encode)).digest("hex");
    console.log("\ndynamicData_index_encode_bytes_sha256: 0x" + dynamicData_index_encode_sha256);



    console.log("\nsha256输入bytes----> \n");
    dynamicData_index_encode_bytes = web3.utils.hexToBytes(dynamicData_index_encode);
    console.log("   dynamicData_index_encode_bytes :\n", dynamicData_index_encode_bytes);

    obj = crypto.createHash("sha256");
    dynamicData_index_encode_sha256 = obj.update(Buffer.from(dynamicData_index_encode_bytes)).digest("hex");
    console.log("\dynamicData_index_encode_bytes_sha256: 0x" + dynamicData_index_encode_sha256);

    console.log("\n");
}

async function test() {
    console.log("start test");
    var dynamicData = "0x0dd9fe0e2c33052886b7e30285180c63b44900f60f94f65c24bd29c6f40f377d";
    var leaf_count = 1024;
    var leaf_deep  = 10;
    var leaf_index = 512;
    var root = merkle.get_root(dynamicData, leaf_count, leaf_deep);
    console.log("dynamicData:", dynamicData);
    console.log("leaf_count:", leaf_count);
    console.log("leaf_deep:", leaf_deep);
    console.log("leaf index:", leaf_index);
    console.log("root: ", root);

    console.log("hash(dynamicData + index):", web3.utils.soliditySha3(dynamicData, leaf_index));

    var leaf = merkle.get_leaf(512, dynamicData, leaf_count, leaf_deep);
    console.log("leaf: ", leaf);


    var leaf_hash = merkle.get_leaf_hash(512, dynamicData, leaf_count, leaf_deep);
    console.log("leaf_hash: ", leaf_hash);

    var proof = merkle.get_proof_by_hash(leaf_hash, dynamicData, leaf_count, leaf_deep);

    console.log("proof: ", proof);

    var isValid = merkle.verify(root, leaf, proof);
    console.log("verify state: ", isValid);

    console.log("end test");
}

async function proof1() {
    console.log("start proof1");
    var root = "0x87e57b8a60624c9858c00d5c958bb0e869127b4f3bc66e2d291dfb5d3fab655b";
    var leaf = "0x19ab34f93ee69ded429091e1780430ec7b08f89af8cbacb988c428fec10a4a51";
    var proof = [
        '0x09e74b72359ed4b91a4c3f2a26e3547ebf926ab1a19913688edba322d662f117',
        '0x7b1eb185cd52e6acde31700f08fb0363f6f5ea3197c3ec80393829f9f9e9bfe2',
        '0x441e2d65393cc809a1821a932c012a84adbb6dceb8568b1ee4ea5a033fca56e1',
        '0x03f3dda944bb2e24ae4979edee3820910836468cc0f23b778731ee3431f911b8',
        '0x417c8b9bafc18d4fec3245299d3efc281c9f810456a65c3435cb62aee93fb0b5',
        '0x900de983e9f4fd120903179617a11385fd2436df46fea357dcdc89b7f85a8331',
        '0x2913579d3c3c75711a04d4493c645385f31f01d5634ee168d8dfcc398e5efd8e',
        '0x41a9f2a93929f3489c58cd11dd54da8b8851d7ad3bf3fa8f2fe0c7c2d2b09b52',
        '0x02270e805a57e2599f20d539b6218ad75f32b7c2248275e2c1b3498cdfae1c2b',
        '0xbc9fd285d0f23001b26e05b4b56c5839e8601ecbd98e50ca2e3bb85e88031a7d'
    ];
    var state = merkle.verify(root, leaf, proof);
    console.log("state:", state);
    console.log("end proof1");

}
async function proof() {
    var root = "0xe98a2f6fd91801f578e951c76304fd97e8972db9a18da1f811bbe62ff99af17d";
    var data = {"leaf": "0x841629f5409de5004aec1ecf85f353b3fe7c642ca3330937eee80a9b9d261bb2", "proof": ["0x4706ce5c9aaffdfde4968459e830ced6a12e454a194d2133f4f23e5cda670072", "0x107ff23ef2cc46e5f91d8755906f2495f6e24a869ccebe72ed7881b439e0d1d7", "0x990dafdbbec5e2de8fe2e48cf6d5caced8ff7f5ae46eaed59a8d8df39a9cda4b", "0xb558172985fcace2f732cd497c0c5567b90edaf02bfee52d0734523d4842f0b7", "0x9ae59ad3355e4888b08ba18a993889f48eec136510d4143ab6d6c0415fb57833", "0x41bf97c64979216596973f790e44403f5ddb22337ae69a77ef177059089569ee", "0x64a8d7ae5418e86300cd058f8ef31a0a0ba84c2713475e849f8adc132f577282", "0xb8c3163db195f45571303370449899f4a67523c2f148ee6f0c002eccd1ccb105", "0x7bce2e0e28c3c6518fceb7c4303996687fbd92e397450a754871929bb7659375", "0xbe3d0b35abbb3c39b0756bf8b7920b4b6a3cd7d13e1f46f750d6b69033e28258"]}

    var leaf =data["leaf"];
    console.log("leaf: ", leaf);

    var proof = data["proof"];
    console.log("proof: ", proof);

    return merkle.verify(root, leaf, proof);
}



async function run() {
    logger.debug("start working...", "mint");

    //await proof1();
    //await test();
    //logger.info("verify state: " + await proof());
    //await crate_merge_data();
    await test_sha256();

}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
