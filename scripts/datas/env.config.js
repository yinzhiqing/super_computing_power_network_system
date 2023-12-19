const path = require("path");

function get_signer(idx) {
    return ethers.provider.getSigner(idx);
}

config = {
    run: "dev",
    dev: {
        users: {
            buyer: {
                alias: "算力购买者",
                signer: get_signer(19),
            },
            seller : {
                alias: "算力拥有者",
                signer: get_signer(0),
            },
            prover: {
                alias: "证明者",
                signer: get_signer(1),
            },
            manager: {
                alias: "管理者",
                signer: get_signer(0),
            },
            beneficiary: {
                alias: "算力收益者",
                signer: get_signer(2),
            }
        },
        store: {
            filter: {
                seller: {
                    use: false,
                    list: ["0xDB10B29830D75A8157BaB7442d3047Dc200D007E"],
                },
                tokens: {
                    use: false,
                    list: ["0xdff57360e87a4eaff76274653b373fbf577bdf1e4103b843ad168a5256208c33"]
                },
            },
        },
    },
};

module.exports = {
    users: config[config.run].users,
    store: config[config.run].store
};
