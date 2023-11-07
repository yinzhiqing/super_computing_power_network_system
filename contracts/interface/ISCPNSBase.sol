// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

/**
* @title 基础类
* @author yinzhiqing
* @notice 作为基础合约，提供最基础接口，供其它合约继承
* @dev 通过继承此合约，可以快速实现合约开发. 此合约继承openzapplin的ERC721相关可修改合约
*/
interface ISCPNSBase {
    /**
    * @notice 将数据写入日志
    * @dev 作为基本事件函数使用（mint, update时候会用到）
    * @param from 是发起交易的账户地址，作为索引之一
    * @param to 是接受token的账户地址, 作为索引之一
    * @param tokenId ID，不可重复
    * @param tokenName 名称，不可重复
    * @param data 字符串格式的数据值, 一个tokenId对应一个data，长度受gasLimit制约，内容不限制
    */
    event UpdateDatas(address indexed from, address indexed to, uint256 indexed tokenId, bytes32 tokenName, string data);

    /**
    * @notice 更新指定token对应的datas值
    * @param tokenId 必须已经存在
    * @param datas 新的data值
    */
    function update(uint256 tokenId, string memory datas) external;

    /**
    * @notice 将合约状态设置为暂停，部分接口将暂停使用
    * @dev 合约中设置whenNotPaused的将受到影响
    */
    function pause() external;

    /**
    * @notice 将合约状态从暂停状态中恢复， 此操作将恢复接口提供的功能
    * @dev 合约中设置whenNotPaused的将受到影响
    */
    function unpause() external;

    /**
    * @notice 类型
    * @return type 为此合约中token设置的类型（cpu gpu等）
    */
    function unitType() external view returns(string memory);

    /** 
    * @notice token对应的名称
    * @dev tokenId 和 name是对应的，并且都是唯一的
    * @param tokenId 必须是已经存在的
    * @return name tokenId对应的名称
    */
    function nameOf(uint256 tokenId) external view returns(bytes32);

    /** 
    * @notice token对应的datas
    * @dev tokenId对应的datas可以更新，此操作将影响日志
    * @param tokenId 必须是已经存在的
    * @return datas tokenId对应的字符串数据
    */
    function datasOf(uint256 tokenId) external view returns(string memory);

    /** 
    * @notice token对应的ID
    * @dev tokenId 和 name是对应的，并且都是唯一的
    * @param name_ 必须是已经存在的
    * @return tokenId name对应的tokenId
    */
    function tokenIdOf(bytes32 name_) external view returns(uint256);

    /**
    * @notice 检查指定的tokenId是否存在
    * @dev 可判定指定的tokenId存在性
    * @param tokenId 需要判定的token id
    * @return bool true： 存在， false: 不存在
    */
    function exists(uint256 tokenId) external view returns(bool);

    /**
    * @notice 判定指定的owner是否是指定的tokenId的拥有者
    * @dev 此接口可以快速判定token与owner关系，内部调用了ownerOf，省去了外部地址比较
    * @param tokenId 目标tokenId
    * @param owner  目标账户地址
    * @return bool true: 是 false: 不是
    */
    function isOwner(uint256 tokenId, address owner) external view returns(bool);

}
