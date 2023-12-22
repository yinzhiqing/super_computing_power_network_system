const path = require("path");

function get_signer(idx) {
    return ethers.provider.getSigner(idx);
}

config = {
    run: "dev",
    dev: {
        users_cache_name: "users.cache.json",
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
            cleaner: {
                alias: "市场清理者",
                signer: get_signer(8),
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
                    list: ["0xd425dcd4f2d46e5f21eefcf8c6b3ceacecfd03803baf91d28d6505869c51c6d9"]
                },
            },
        },
    },
};

module.exports = {
    users: config[config.run].users,
    users_cache_name: config[config.run].users_cache_name,
    store: config[config.run].store
};
