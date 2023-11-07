
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

/**
* @title 合约DNS
* @notice 设置合约名称与地址对照表
* @dev 合约名称固定，地址可变更
*/
interface ISCPNSDns
{
    /**
    * @notice 设置DNS事件
    * @dev 添加或变更时调用
    * @param name 合约名称
    * @param addr 合约地址
    * @param manager 合约管理者
    */
    event Set(string indexed name, address addr, address manager);

    /**
    * @notice 删除事件
    * @dev 删除时调用
    * @param name 合约名称
    * @param addr 合约地址
    * @param manager 合约管理者
    */
    event Del(string indexed name, address addr, address manager);

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
    * @notice 设置名称与地址映射
    * @dev 名称-地址以map形式保存
    * @param name_ 合约名称
    * @param add_ 合约地址
    */
    function set(string memory name_, address add_) external;

    /**
    * @notice 合约名称
    * @dev 返回合约初始化时候设置的name
    */
    function name() external view returns(string memory);

    /**
    * @notice 合约代号
    * @dev 返回合约初始化时候设置的symbol
    */
    function symbol() external view returns(string memory);

    /**
    * @notice 获取合约地址
    * @dev 根据合约名称获取合约地址
    * @param name_ 合约名称
    * @return 合约地址
    */
    function addressOf(string memory name_) external view returns(address);

    /**
    * @notice 检查合约名称是否存在
    * @dev 检查合约名称是否存在
    * @param name_ 名称
    * @return 是否存在状态
    */
    function exists(string memory name_) external view returns(bool);

    /**
    * @notice 获取DNS中合约数量
    * @return 合约数量
    */
    function count() external view returns(uint256);
    /**
    * @notice 从列表中获取合约名称和地址
    * @dev index必须小于 count获取的值
    * @return 返回名称和对应的地址
    */
    function hostOf(uint256 index) external view returns(string memory, address);
}
