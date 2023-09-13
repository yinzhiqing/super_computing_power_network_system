const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const {StandardMerkleTree} = require("@openzeppelin/merkle-tree");


async function crate_values(dynamicData, leaf_count, leaf_deep) {

    let values = [];
    for (var i = 0; i < leaf_count; i++) {
        var leaf = utils.create_leaf_hash(dynamicData, i, leaf_deep);
        //logger.debug("index(" + i +"): " + leaf);
        values.push([leaf]);
    }
    return values;
}
async function create_merkel(dynamicData, leaf_count, leaf_deep) {
    let values = await crate_values(dynamicData, leaf_count, leaf_deep);

    // (2)
    const tree = StandardMerkleTree.of(values, ["bytes32"]);

    // (3)
    console.log('Merkle Root:', tree.root);

    // (4)
    fs.writeFileSync("tree.json", JSON.stringify(tree.dump()));

    return tree.root;

}

async function get_proof(leaf) {
    const tree = StandardMerkleTree.load(JSON.parse(fs.readFileSync("tree.json", "utf8")));


    let proof ;
    // (2)
    for (const [i, v] of tree.entries()) {
        if (v[0] === leaf) {
            // (3)
            proof = tree.getProof(i);
            return proof;
        }
    }
    return "";
}
async function get_leaf(index) {
    const tree = StandardMerkleTree.load(JSON.parse(fs.readFileSync("tree.json", "utf8")));

    for (const [i, v] of tree.entries()) {
        if (i === index) {
            return v ;
        }
    }
    throw "没有发现leaf";
}

async function verify(root, leaf, proof) {
    console.log("leaf: " , leaf);
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
