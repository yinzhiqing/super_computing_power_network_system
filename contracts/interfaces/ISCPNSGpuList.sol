
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

/**
* @title GPU资源管理
* @notice 创建不同型号的GPU通证, 基本操作继承月SCPNBase合约
*/
interface ISCPNSGpuList is 
    ISCPNSBase
{
    /**
    * @notice 创建新的型号的GPU
    * @dev 创建GPU时候，名称设置要有一定规律，可以防止重复设置
    * @param tokenId GPU资源ID， 唯一
    * @param name_ GPU名称， 唯一
    * @param datas 辅助信息
    */
    function mint(uint256 tokenId, bytes32 name_, string memory datas) external;
}
