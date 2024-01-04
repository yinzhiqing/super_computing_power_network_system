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
