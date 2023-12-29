const fs        = require('fs');
const utils     = require("./utils");
const logger    = require("./logger");
async function run() {
    logger.log("\t" + 25);
    logger.form("这里是标题", 
        {
            "姓名": "小嘎手动阀地方", 
            "地点阿斯顿发发": "asdfadf", 
            "地地点地地地点地": logger.str_show_len("地点地点地点地点"), 
            "姓名姓名姓姓名": "姓名姓名姓名姓".length, 
            "姓名姓名姓名姓": Buffer.from("姓名姓名姓名姓").length, 
            "姓名姓名姓名姓": logger.str_show_len("姓名姓名姓名姓"), 
            "aaaa": Buffer.from("aaaa").length, 
            "中aaab": logger.str_show_len("中aaaa"), 
            "点numba":1221421,
            "     0xDB10B29830D75A8157BaB7442d3047Dc200D007E": 25
        }, 
        {
            "总结": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        });
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
