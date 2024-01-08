const readline = require('readline');
const {exec, spawn}   = require('child_process');
 
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

rl.setPrompt('输入命令: ');

/*
rl.on('line', (input) => {
    exec(`${input}`, {shell:process.platform === "linux"}, (error, stdout, stdin) => {
        if(error) {
            console.error(`error: ${error}`);
        }
        console.log(`stdout: ${stdout}`);
    });
    rl.prompt();
});
*/


async function run(name) {
    console.log(name);
    const python    = spawn('make', [name]);
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


rl.on('line', (input) => {
    run(input);

});
