# 背景
  为了更专注于编写合约，发布及更新合约，快速迭代开发，减少合约管理的工作量，我将一些工作进行了脚本管理，使合约开发工作更加简单一些．


# 功能
  solidity合约开发，以太坊及兼容环境下合约开发 发布　更新.



# 安装

## 依赖
  npm 7.21.x
  node ^12.22.4

```
  $> git clone https://github.com/yinzhiqing/templete-sol.git
  $> cd templete-sol
  $> npm install
```

## install web3j

```
  $> curl -L get.web3j.io | sh && source ~/.web3j/source.sh
```


## install solc solc-select 

### install solc
```
  $> sudo add-apt-repository ppa:ethereum/ethereum
  $> sudo apt-get update
  $> sudo apt-get install solc
```

### install solc-select
```
  #python -m pip install solc-select
  $> python -m pip install --upgrade pip

  # 当前solc版本
  $> solc --version
  solc, the solidity compiler commandline interface
  Version: 0.8.6+commit.11564f7e.Linux.g++
  # 安装并切换其他版本
  $> solc-select install 0.5.0
  $> solc-select use 0.5.0
  # 查看版本
  $> solc --version
  solc, the solidity compiler commandline interface
  Version: 0.5.0+commit.1d4f565a.Linux.g++
```

# 使用说明

## 配置运行环境

### 配置运行链(hardhat.config.js)

## 运行环境连接链配置
  defaultNetwork： "localhost",
   
```
  //修改 defaultNetwork 可用应用不同的链 

  //mnemonic, key_infura, key_infura_mainnet 在secrets.json中配置;
  defaultNetwork: "internal", // localhost external internal mainnet
  networks: {
      hardhat: {
          mining: {
              auto: true,
              //interval: [1000, 3000]
          }
      },
      localhost: {
      },

      external: {
          url: `https://kovan.infura.io/v3/${key_infura}`,
          accounts :{mnemonic : mnemonic}
      },
      internal: {
          url: `https://kovan.infura.io/v3/${key_infura}`,
          accounts :{mnemonic : mnemonic}
      },
      mainnet: {
          url: `https://mainnet.infura.io/v3/${key_infura_mainnet}`,
          accounts :{mnemonic : mnemonic}
      }
  },

```   

### secrets.json 格式

```
{
  "mnemonic": 助记词（生成账户用）,
  "key_infura": INFURA_KEY,
  "key_infura_mainnet": INFURA_KEY
}
```

# 开始（此项目）合约开发
  1. 初始化环境 `npm install`
  2. 设置***secrets.json***
  3. 配置***hardhat.config.js***
  4. 添加或编写合约(合约存储路径： ***./contracts*** )
  5. 执行make 编译合约．
  6. 生成新的配置文件(只有第一次执行，以后有新合约，需要手动添加). `./generate_conf.sh`
  7. 6中操作将在 ***./jsons/contracts*** 下生成或更新文件 ***contract_templete.json***, 
     将测文件中的内容拷贝到同目录下的配置文件中（contract_NETWORK.json NETWORK是hardhat.config.js　中应用的defaultNetwork)
  8. 生成开关文件(make open/close　命令用到), 控制那些合约**deploy** 或 **upgrade**. `make init_tokens_script`
  9. 确认合约没有问题．　`make`
  ```
  >$ make
  npx hardhat clean
  npx hardhat compile
  Compiling 18 files with 0.8.1
  Compilation finished successfully
  ```
  10. 查看可deploy 合约 'make index'
  ```
    TempleteEx
    Templete
    ...
  ```
  11. 设置需要deploy的合约(upgrade类似) `make open target=deploy index=all`
  12. deploy 合约. `make deploy`
  13. 查看状态. `make show_contracts`(未发布时，因链上没有即地址空，执行失败) 或 `make show_contracts_conf` 表格中 address内容非空或变更
  14. 生成abi文件到 ***./output*** `make use_solc=true` 
  15. 生成java接口文件，保存在 ***./javas/***　`./export_java.sh`, 此操作依赖 **.bin** 和　**.abi** 文件


# 主要命令
## 查看帮助文件

```

  $> make help

```

## 运行本地节点

```

  $> make run_local_node

```


## 部署合约

```

  $> make open target=deploy
  $> make deploy

```
  
## 更新合约

```

  $> make open target=upgrade
  $> make upgrade

```

## 查看合约配置文件

```
  $> make show_contracts_conf

```

## 查看合约信息（从链上获取）

```

  $> make show_contracts

```

## 生成json配置文件(./jsons/contracts/contract_templete.json)

```

  $> ./generate_conf.sh

```

##

## 代码结构

```

.
|_Makefile                     //命令执行文件
|_export_java.sh               //导出java接口
|_generate_conf.sh             //根据合约生成contract_templete.json文件
├── contracts                  //合约实现文件所在目录
│   └── interfaces             //接口文件所在目录
├── javas                      //合约的java接口文件根目录
├── datas                      //合约发布、更新历史记录
├── jsons                      //自定义配置文件所在目录
│   └── contracts              //合约管理目录
├── output                     //solc输出目录及abi bin文件所在目录
└── scripts                    //功能脚本在此添加
    └── switchs                //开关相关脚本(勿动)
            └── contracts

```

#版本
 v0.1.0 : 初步可用
