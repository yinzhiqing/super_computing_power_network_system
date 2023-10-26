const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle    = require("./merkle.js");

const { defaultAbiCoder }    = require('@ethersproject/abi');
const { hexToBytes }         = require('ethereum-cryptography/utils');
const { keccak256  }         = require('ethereum-cryptography/keccak');
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");


const file_name = "./test-tree.json";
async function crate_values(dynamicData, leaf_count, leaf_deep) {
    let values = [];
    for (var i = 0; i < leaf_count; i++) {
        var leaf = merkle.create_leaf(dynamicData, i, leaf_deep);
        values.push([leaf]);
    }

    return values;
}
async function create_merkel(dynamicData, leaf_count, leaf_deep) {
    let values = await crate_values(dynamicData, leaf_count, leaf_deep);
    const tree = StandardMerkleTree.of(values, ["bytes32"]);

    fs.writeFileSync(file_name, JSON.stringify(tree.dump()));

    return tree.root;

}

async function get_proof(leaf) {
    const tree = StandardMerkleTree.load(JSON.parse(fs.readFileSync(file_name, "utf8")));
    for (const [i, v] of tree.entries()) {
        if (v[0] === leaf) {
            return tree.getProof(i);
        }
    }
    return "";
}
async function get_leaf(index) {
    const tree = StandardMerkleTree.load(JSON.parse(fs.readFileSync(file_name, "utf8")));
    for (const [i, v] of tree.entries()) {
        if (i === index) {
            return v ;
        }
    }

    throw "没有发现leaf";
}

async function verify(root, leaf, proof) {
    console.log("proof: ",  proof);

    let isValid =  StandardMerkleTree.verify(root, ["bytes32"], leaf, proof);
    logger.info(leaf + " is vailed: " + isValid);
}

async function run() {
    logger.debug("start working...", "create merkel");

    let dynamicData = "0x58c8e3399859d95303da28857cdddff61ad7dcfa7bb9bcbe04f5f01e14972140";
    let leaf_count = 1024;
    let leaf_deep = 10;
    let root = await create_merkel(dynamicData, leaf_count, leaf_deep);
    console.log("root:", root);
    let leaf = await get_leaf(99);
    let proof = await get_proof(leaf[0]);
    await verify(root, leaf, proof);
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
