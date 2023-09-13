const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");

const {StandardMerkleTree} = require("@openzeppelin/merkle-tree");


function crate_values(dynamicData, leaf_count, leaf_deep) {

    let values = [];
    for (var i = 0; i < leaf_count; i++) {
        var leaf = utils.create_leaf_hash(dynamicData, i, leaf_deep);
        values.push([leaf]);
    }
    return values;
}
function create_merkel(filename, dynamicData, leaf_count, leaf_deep) {
    let values = crate_values(dynamicData, leaf_count, leaf_deep);

    const tree = StandardMerkleTree.of(values, ["bytes32"]);

    fs.writeFileSync(filename, JSON.stringify(tree.dump()));

    return tree;

}

function get_tree(dynamicData, leaf_count, leaf_deep) {
    let filename = dynamicData + "-tree.json";
    if (fs.exists(filename)) {
       return StandardMerkleTree.load(JSON.parse(fs.readFileSync(filename, "utf8")));
    }
    return create_merkel(filename, dynamicData, leaf_count, leaf_deep);
}

function get_root(dynamicData, leaf_count, leaf_deep) {
    let tree = get_tree(dynamicData, leaf_count, leaf_deep);
    return tree.root;
}

function get_proof(leaf, dynamicData, leaf_count, leaf_deep) {
    let tree = get_tree(dynamicData, leaf_count, leaf_deep);

    for (const [i, v] of tree.entries()) {
        if (v[0] === leaf) {
            return tree.getProof(i);
        }
    }
    throw "没有发现leaf";
}
function get_leaf(index, dynamicData, leaf_count, leaf_deep) {
    let tree = get_tree(dynamicData, leaf_count, leaf_deep);

    for (const [i, v] of tree.entries()) {
        if (i === index) {
            return v[0] ;
        }
    }
    throw "没有发现leaf";
}

function verify(root, leaf, proof) {
    let isValid =  StandardMerkleTree.verify(root, ["bytes32"], leaf, proof);
    logger.info(leaf + " is vailed: " + isValid);
}

module.exports = {
    get_root,
    get_proof,
    get_leaf,
    verify
}
