const prj    = require("../prj.config.js");
const markdown  = require("./markdown");
const logger    = require("./logger");
const utils     = require("./utils");

const tokens = require(prj.contract_conf);


async function convert_contract() {
    token_list = []
    for (i in tokens) {
        //tokens[i].params = utils.contract_arguments_parse(tokens, tokens[i].params);
        token_list.push({name:tokens[i].name, address: tokens[i].address});
    }

    md_text = 
        markdown.new_markdown("contract")
        .append_h1("mapping contract in prj(Automatically generated, do not manually modify) network: " + prj.network)
        .append_empty_line()
        .append_map_list(token_list)
        .text();
    md_file = 
        utils.filename_parse(prj.contract_conf)
        .change_ext(".md");
    logger.info("update file: " + md_file);
    utils.write_datas(md_file, md_text);
}

async function run() {
    logger.debug("start working...", "make jsons docs");
    await convert_contract();
}

run()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
