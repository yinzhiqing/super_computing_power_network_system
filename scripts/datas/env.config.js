const path = require("path");

function get_signer(idx) {
    return ethers.provider.getSigner(idx);
}

config = {
    run: "dev",
    dev: {
        users: {
            buyer: {
                index: 19,
                alias: "算力购买者",
                signer: get_signer(19),
            },
            seller : {
                index: 0,
                alias: "算力拥有者",
                signer: get_signer(0),
            },
            prover: {
                index: 1,
                alias: "证明者",
                signer: get_signer(1),
            },
            manager: {
                index: 0,
                alias: "管理者",
                signer: get_signer(0),
            },
        },
        store: {
            filter: {
                seller: {
                    use: true,
                    list: ["0xDB10B29830D75A8157BaB7442d3047Dc200D007E"],
                },
                tokens: {
                    use: true,
                    list: ["0xdff57360e87a4eaff76274653b373fbf577bdf1e4103b843ad168a5256208c33"]
                },
            },
        },
    },
};

module.exports = {
    users: config[config.run].users
};
