
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
    function mint(uint256 tokenId, bytes32 name_, address unitAddr, uint256 unitId, string memory datas) external;
    function unitTypeOf(uint256 tokenId) external view returns(string memory);
    function unitDatasOf(uint256 tokenId) external view returns(string memory);
    function unitIdOf(uint256 tokenId) external view returns(uint256);
}
