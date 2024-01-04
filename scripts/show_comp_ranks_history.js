const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const { spawn } = require('child_process');
const crb       = require("./comp_ranks_base.js");

async function extract_from_map(datas) {
    let ret = [];
    if (Array.isArray(datas)) {
        return [{key: "", data: datas}];
    }

    //datas type is map
    for(var idx in datas) {
        let kv = await extract_from_map(datas[idx]);
        for (k in kv) {
            ret.push({
                key: kv[k]["key"] != ""  ? idx + "_" + kv[k]["key"] : idx + kv[k]["key"],
                data: kv[k]["data"]
            });
        }
    }
    return ret;
}
async function convert_to_config(list) {

    logger.debug("convert_to_config list");
    let datas = await extract_from_map(list);

    let plots = [];
    for (i in datas) {
        let plot = {};
        plot["title"] = datas[i]["key"];
        plot["type"] = "plot";
        let pixs = datas[i]["data"];
        let x = [];
        let y = [];
        for (idx in pixs) {
            x.push(pixs[idx]["x"].toString());
            y.push(pixs[idx]["y"]);
        }

        plot["x"] = x;
        plot["y"] = y;

        plots.push(plot);
    }

    let config = {
        libname: "cyberpunk",// matplotx cyberpunk
        rows: datas.length,
        cols: 1,
        xlabel: "time",
        ylabel: "count",
        plots: plots
    };

    return config;

}
async function show_gr(list) {
    const config =  await convert_to_config(list);
    logger.debug(config);
    const python    = spawn('python', ['pyscripts/plot.py', JSON.stringify(config)]);
    python.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    python.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    python.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

}

async function run() {
    logger.debug("start working...", "show_tokens");
    let list = await crb.comp_ranks_history();
    await show_gr(list);
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

