const fs        = require('fs');
const utils     = require("./utils");
const logger    = require("./logger");
async function run() {
    logger.form("这里是标题", {"姓名": "小嘎手动阀地方", "地点阿斯顿发发": "asdfadf", "number":1221421}, {"总结": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"});
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
