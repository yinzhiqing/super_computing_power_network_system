
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

/**
* @title 算力类型管理
* @notice 算力类型设置与查询
* @dev 算力类型将不同的算力单元汇聚到一起，方便算力单元创建及扩展
*/
interface ISCPNSTypeUnit is
    ISCPNSBase
{
    /**
    * @notice 创建算力类型
    * @dev 算力类型将多种算力资源汇聚
    * @param tokenId 算力类型Id, 唯一
    * @param name_ 算力类型名称，唯一
    * @param unitAddr 算力资源合约地址
    * @param unitId 算力资源ID
    * @param datas 辅助数据(json字符串)
    */
    function mint(uint256 tokenId, bytes32 name_, address unitAddr, uint256 unitId, string memory datas) external;

    /**
    * @notice 获取资源类型
    * @dev 获取资源类型（资源类型在合约初始化时设定）
    * @param tokenId  算力类型ID
    * @return 资源类型
    */
    function unitTypeOf(uint256 tokenId) external view returns(string memory);

    /**
    * @notice 获取资源的辅助数据
    * @dev 获取算力类型对应资源的辅助数据
    * @param tokenId 算力类型ID
    * @return 辅助数据
    */
    function unitDatasOf(uint256 tokenId) external view returns(string memory);

    /**
    * @notice 获取算力类型对应的资源ID
    * @dev 获取算力资ID对应的资源ID
    * @param tokenId 算力资源ID
    * @return 算力资源ID
    */
    function unitIdOf(uint256 tokenId) external view returns(uint256);
}
