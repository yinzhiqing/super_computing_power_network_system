const readline          = require('readline');
const logger            = require("./logger");
const {exec, spawn}     = require('child_process');
const {uco, tco}        = require('./cache_opts.js');
 
// 创建接口对象
const rl = readline.createInterface({
    input: process.stdin, // 从标准输入读取数据
    output: process.stdout // 将结果打印到控制台上
});

/*
rl.question("请输入您的名字：", (name) => {
    console.log(`欢迎 ${name}！`);

    rl.close(); // 关闭接口
});
*/


const commands = {
    exit : {
        name: "exit",
        args: "",
        desc: "退出"
    },
    upuid: {
        name: "upuid",
        args: "<use_right_id> [usage = true]",
        desc: "更新目标使用权通证",
    },
    accounts: {
        name: "accounts",
        args: "",
        desc: "钱包账户"
    },
    make: {
        name: "make",
        args: "[name]",
        desc: "执行脚本"
    },

}

let prompts = "usage: cmd [arg1] [arg2] ... [argn]\n";

for(let i in commands) {
    prompts += `\t${commands[i].name}\t\t\t\t--${commands[i].desc}\n`;
    prompts += `\t\tex. ${commands[i].name} ${commands[i].args}\n`;
}
prompts += "输入命令：";

rl.setPrompt(prompts);


async function call(args) {
    let argv = args.split(" ");
    let argn = argv.length;
    if (argn == 0) {
        return;
    }
    let cmd = argv[0];
    argv.shift();
    switch(cmd) {
        case "exit":
            process.exit();
            break;
        case "upuid":
            tco.update_fixed_use_right_id.apply(null, argv);
            break;
        case "accounts":
            make(cmd);
        case "make":
            make.apply(null, argv);
        default:
            break;
    }
}

async function make(name) {
    const python    = spawn('make', [name]);
    python.stdout.on('data', (data) => {
        console.log(`${data}`);
    });


    /*
    python.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
     */
    python.on('close', (code) => {
    });
}
async function run(input) {
    call(input);
}


rl.prompt();
rl.on('line', (input) => {
    run(input);
    rl.prompt();
});


