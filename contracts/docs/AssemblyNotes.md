# CONTENT

**Note**: The Assembly Notes Specification is under development and may be updated in the future.

日志合约

## Overview


## Version

v1.0.0




---


## Interface

### write

**Description**

写日志到链上

#### Return

无返回值

#### Parameters


<table>
 <tr>
  <td><strong>Name</strong></td>
  <td><strong>Type</strong></td>
  <td><strong>Description</strong></td>
 </tr>
 <tr>
  <td><strong>data</strong></td>
  <td>string</td>
  <td>日志内容</td>
 </tr>
</table>


### preBlockNumberOf

**Description**

查询指定用户最后一个日志所在的块号

#### Return

块号

#### Parameters


<table>
 <tr>
  <td><strong>Name</strong></td>
  <td><strong>Type</strong></td>
  <td><strong>Description</strong></td>
 </tr>
 <tr>
  <td><strong>writer</strong></td>
  <td>address</td>
  <td>用户钱包地址</td>
 </tr>
</table>

```
```

### countOf

**Description**

指定用户写入日志数量

#### Return

#### Parameters


<table>
 <tr>
  <td><strong>Name</strong></td>
  <td><strong>Type</strong></td>
  <td><strong>Description</strong></td>
 </tr>
 <tr>
  <td><strong>writer</strong></td>
  <td>address</td>
  <td>用户钱包地址</td>
 </tr>
</table>

```
```


### Write

**Description**

链上事件

#### Return

交易信息

#### Parameters


<table>
 <tr>
  <td><strong>Name</strong></td>
  <td><strong>Type</strong></td>
  <td><strong>Description</strong></td>
 </tr>
 <tr>
  <td><strong>sender</strong></td>
  <td>address</td>
  <td>用户钱包地址</td>
 </tr>
 <tr>
  <td><strong>index</strong></td>
  <td>uint256</td>
  <td>此处填写 null</td>
 </tr>
 <tr>
  <td><strong>senderIndex</strong></td>
  <td>uint256</td>
  <td>用户日志序号0~n</td>
 </tr>
</table>

```
    //合约中记录日志的函数原型
    event Write(address indexed sender, uint256 indexed index, uint256 indexed senderIndex, uint256 preBlockNumber, uint256 timestamp, string data);

    //ethers.js 实例 hardhat中实现
    //获取日志数据，递归方式获取，从新->旧获取
    async function read(client, address, block_number, index, max_count, msgs)
    {
        if (max_count <= 0 || block_number <= 0 || index < 0) return [];
        filter = await client.filters.Write(address, null, index);
        filter["fromBlock"] = block_number;
        filter["toBlock"] = block_number;
        //获取日志
        logs = await ethers.provider.getLogs(filter);
        pre_block_number = 0;
        for (i in logs) {
            //log 为字典类型
            log = logs[i];
            //从log中获取data即日志数据
            data = log["data"];
    
            //链数据库存储数据转换为本地数据
            datas = web3.eth.abi.decodeParameters(["uint256", "uint256", "string"], data);
            pre_block_number = web3.utils.toBN(datas["0"]);
            //获取需要的数据
            let event_data = { 
                "blockNumber": log["blockNumber"],
                "blockHash": log["blockHash"],
                "transactionHash": log["transactionHash"],
                "timestamp": datas["1"], 
                "data": web3.eth.abi.decodeParameter("string", datas["2"])
            };
            msgs.push(event_data);
        }
    
        //获取用户的上一个日志
        max_count--;
        if (max_count > 0) {
            index--;
            await read(client, address, pre_block_number.toNumber(), index, max_count, msgs);
        }
    }
    
    async function run() {
        logger.debug("start working...", "notes");
    
        //根据合约地址获取合约操作对象
        token = tokens["AssemblyNotes"];
        let cobj = await get_contract(token.name, token.address);
    
        //设置要查询的写日志地址(钱包地址)
        const accounts = await web3.eth.getAccounts();
        address = accounts[0];
    
        //获取用户最后一个日志所在的块号
        block_number = await cobj.preBlockNumberOf(address);
        //获取用户日志数量, 确认最后一个日志数量
        //最后一个日志序号= 数量 - 1
        count = await cobj.countOf(address);
    
        if (block_number == 0 || count == 0) {
            logger.info("not found logs");
            return;
        }
    
        //获取用户指定数量的日志，从最新日志开始算
        msgs = []
        await read(cobj, address, block_number.toNumber(), count - 1, 10, msgs);

        显示
        msgs.forEach(function(item) {logger.table(item)});
    }

```


# version list

## v1.0.0
   - xxx
