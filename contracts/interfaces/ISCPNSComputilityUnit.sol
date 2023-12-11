// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

/**
* @title 算力单元
* @author yinzhiqing
* @notice 算力单元管理
* @dev 算力类型创建对应的算力单元
*/
interface ISCPNSComputilityUnit is 
    ISCPNSBase
{
    /**
    * @notice 创建新的算力单元
    * @dev 发起交易者需要有MINTER_ROLE权限
    * @param to 算力单元拥有者钱包地址
    * @param tokenId 算力单元ID，唯一
    * @param typeUnitId 算力单元对应算力类型ID
    * @param typeUnitCount_ 包含算力资源数量
    * @param datas 辅助数据
    */
    function mint(address to, uint256 tokenId, uint256 typeUnitId, uint256 typeUnitCount_, string memory datas) external;

    /**
    * @notice 锁定一定数量的算力单元
    * @dev 使用算力单元时，需要锁定，防止重用
    * @param tokenId 算力单元ID
    * @param typeUnitCount 算力单元对应的算力类型数量
    */
    function lockResources(uint256 tokenId, uint256 typeUnitCount) external;

    /**
    * @notice 解锁一定数量的算力单元
    * @dev 释放使用算力单元时，需要解锁，是算力单元可被再次利用
    * @param tokenId 算力单元ID
    * @param typeUnitCount 算力单元对应的算力类型数量
    */
    function unlockResources(uint256 tokenId, uint256 typeUnitCount) external;

    /**
    * @notice 获取某种算力类型的总数量
    * @dev 获取所有mint的算力单元中包含的指定算力类型总数量
    * @param tokenId 算力类型ID
    * @return 总数量
    */
    function countOfTypeUnit(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取所属算力类型ID
    * @dev 只能绑定一个算力类型
    * @param tokenId 算力单元ID
    * @return 算力类型ID
    */
    function typeUnitIdOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取包含算力类型资源数量
    * @dev 可以包含1个以上的算力类型
    * @param tokenId 算力单元ID
    * @return 算力资源数量
    */
    function typeUnitCountOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 算力单元中还处于未分配状态的资源数量
    * @dev 算力单元还未被设置为有效算力
    * @param tokenId 算力单元ID
    * @return 算力资源数量
    */
    function leaveCountOf(uint256 tokenId) external view returns(uint256);
}
