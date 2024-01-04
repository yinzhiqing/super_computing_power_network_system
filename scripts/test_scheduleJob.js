const fs        = require('fs');
const path      = require("path");
const program   = require('commander');
const utils     = require("./utils");
const logger    = require("./logger");
const prj       = require("../prj.config.js");
const merkle  = require('./merkle');
const {users}       = require("./datas/env.config.js");
const { contracts_load } = require("./contracts.js");
const pvb       = require("./proof_verify_base.js");

const readline = require('readline');
 
// 创建接口对象
const rl = readline.createInterface({
    input: process.stdin, // 从标准输入读取数据
    output: process.stdout // 将结果打印到控制台上
});
 
rl.question("请输入您的名字：", (name) => {
    console.log(`欢迎 ${name}！`);
    rl.close(); // 关闭接口
});

async function work(user, buf) {
    logger.debug(buf);
    logger.debug(user);
    buf["test"] = true;

}

async function print(msg) {
    logger.debug(msg);
}

async function run(times) {
    let buf = {};
    let buf1 = new String("buf1 value");
    let user = users.prover;
    let b = true;
    let n = 2;
    let ary = [];
    logger.debug("buf type: " + (buf instanceof Object));
    logger.debug("user type: " + (user instanceof Object));
    logger.debug("user type: " + (user instanceof Array));
    logger.debug("buf1 type: " + (buf1 instanceof String));
    console.log(`user info: ${buf1}`);
    console.log(`boolean value: ${!!n}`);
    console.log(`var type: ${Array instanceof Array}`);
    console.debug(arguments);
    await print.apply(this, arguments);
    //await utils.scheduleJob(times,  work, [user, buf], false, 30);
}
/*
run(3)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
  */
