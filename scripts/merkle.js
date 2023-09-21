const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { hexToBytes }         = require('ethereum-cryptography/utils');
const { keccak256  }         = require('ethereum-cryptography/keccak');
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");
const { defaultAbiCoder }    = require('@ethersproject/abi');


function create_leaf(dynamicData, index, leaf_deep) {
    let leaf = web3.utils.soliditySha3(dynamicData, index);
    for (var j = 1; j < leaf_deep - 1; j++) {
        leaf = web3.utils.soliditySha3(dynamicData, j);
    }
    return leaf;
}

function create_leaf_hash(dynamicData, index, leaf_deep) {
    let leaf = create_leaf(dynamicData, index, leaf_deep);
    return web3.utils.bytesToHex(keccak256(keccak256(hexToBytes(defaultAbiCoder.encode(["bytes32"], [leaf])))));
}
function crate_values(dynamicData, leaf_count, leaf_deep) {
    let values = [];
    for (var i = 0; i < leaf_count; i++) {
        var leaf = create_leaf(dynamicData, i, leaf_deep);
        logger.info("(" + i +"):" + [leaf]);
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
    let filename = "./datas/merkles/" + dynamicData + "-tree.json";
    if(fs.existsSync(filename)) {
            return StandardMerkleTree.load(JSON.parse(fs.readFileSync(filename, "utf8")));
    } else {
            return create_merkel(filename, dynamicData, leaf_count, leaf_deep);
    }
}

function get_root(dynamicData, leaf_count, leaf_deep) {
    let tree = get_tree(dynamicData, leaf_count, leaf_deep);
    return tree.root;
}

function get_proof(leaf, dynamicData, leaf_count, leaf_deep) {
    let tree = get_tree(dynamicData, leaf_count, leaf_deep);

    let leaf_index = tree.leafLookup([leaf]);
    return tree.getProof(leaf_index);
}

function get_proof_by_hash(leaf_hash, dynamicData, leaf_count, leaf_deep) {
    let tree = get_tree(dynamicData, leaf_count, leaf_deep);

    for (const [i, v] of tree.entries()) {
        if (tree.leafHash(v) === leaf_hash) {
            return tree.getProof(i);
        }
    }
    throw "没有发现proof";
}

function get_leaf(index, dynamicData, leaf_count, leaf_deep, use_sha256) {
    if (use_sha256) {
    } else {
        let tree = get_tree(dynamicData, leaf_count, leaf_deep);

        for (const [i, v] of tree.entries()) {
            if (i === index) {
                return v[0] ;
            }
        }
    }
    throw "没有发现leaf";
}

function get_leaf_hash(index, dynamicData, leaf_count, leaf_deep) {
    let tree = get_tree(dynamicData, leaf_count, leaf_deep);

    for (const [i, v] of tree.entries()) {
        if (i === index) {
            return tree.leafHash(v) ;
        }
    }
    throw "没有发现leaf hash";
}

function get_leaf_index(leaf, dynamicData, leaf_count, leaf_deep) {
    let tree = get_tree(dynamicData, leaf_count, leaf_deep);

    for (const [i, v] of tree.entries()) {
        if (v[0] === leaf) {
            return i ;
        }
    }
    throw "没有发现leaf by index";
}

function get_leaf_index_by_hash(leaf, dynamicData, leaf_count, leaf_deep) {
    let tree = get_tree(dynamicData, leaf_count, leaf_deep);

    for (const [i, v] of tree.entries()) {
        if (tree.leafHash(v) === leaf) {
            return i ;
        }
    }
    throw "没有发现leaf by index";
}

function verify(root, leaf, proof) {
    let isValid =  StandardMerkleTree.verify(root, ["bytes32"], [leaf], proof);
    logger.info(leaf + " is vailed: " + isValid);
    return isValid;
}

module.exports = {
    get_root,
    get_proof,
    get_proof_by_hash,
    get_leaf,
    get_leaf_hash,
    get_leaf_index,
    get_leaf_index_by_hash,
    verify,
    create_leaf,
    create_leaf_hash
}
