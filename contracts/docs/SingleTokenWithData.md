# CONTENT

**Note**: The Assembly Logo Specification is under development and may be updated in the future.

资产合约

## Overview


## Version

v1.0.0




---


## Interface

### mint

**Description**

为指定地址mint token

#### Return

#### Parameters


<table>
 <tr>
  <td><strong>Name</strong></td>
  <td><strong>Type</strong></td>
  <td><strong>Description</strong></td>
 </tr>
 <tr>
  <td><strong>to</strong></td>
  <td>address</td>
  <td>接收token地址</td>
 </tr>
 <tr>
  <td><strong>tokenId</strong></td>
  <td>uint256</td>
  <td>token Id</td>
 </tr>
 <tr>
  <td><strong>data</strong></td>
  <td>string</td>
  <td>token 对应的数据</td>
 </tr>
</table>

```

    function mint(address to, uint256 tokenId, string memory datas) public virtual 

```


### dataOf

**Description**

获取指定token对应的数据data

#### Return

data

#### Parameters


<table>
 <tr>
  <td><strong>Name</strong></td>
  <td><strong>Type</strong></td>
  <td><strong>Description</strong></td>
 </tr>
 <tr>
  <td><strong>tokenId</strong></td>
  <td>uint256</td>
  <td></td>
 </tr>
</table>

```

    function datasOf(uint256 tokenId) public view virtual returns(string memory) 

```


# version list

## v1.0.0
   - xxx
