const path      = require("path");
const utils     = require("../utils");

config = {
    run: "dev",
    dev: {
        vm: {
            //算力资源使用期限5年
            deadline: 5 * 365 * 24 * 60 * 60,
        },
        use_right: {
            //使用权通证使用期限10分钟
            deadline:  30 * 60 * 60,
            renewal_times:  30 * 24 * 60 * 60,
            resetlife_times:  6 * 60,
            filter_count: 10,
        },
        proof_task:  {
            filter_count: 10,
        },
        verify_task:  {
            filter_count: 10,
        },
        use_types: ["CPU"],
        users_cache_name: "users.cache.json",
        tokens_cache_name: "tokens.cache.json",
        users: {
            buyer: {
                alias: "购买者",
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
                orders: {
                    use: 10,
                    revenue: 10,
                },
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



function get_signer(idx) {
    return ethers.provider.getSigner(idx);
}

function to_full_path(dirname, subdir, name) {
   return path.join(dirname ,  subdir, name);
}

const cur_config         = config[config.run];
module.exports = {
    users:              cur_config.users,
    store:              cur_config.store,
    use_types:          cur_config.use_types,
    users_cache_path:   to_full_path(__dirname, "./", cur_config.users_cache_name),
    tokens_cache_path:  to_full_path(__dirname, "./", cur_config.tokens_cache_name),
    vm:                 cur_config.vm,
    use_right:          cur_config.use_right,
    proof_task:         cur_config.proof_task,
    verify_task:        cur_config.verify_task,
};
