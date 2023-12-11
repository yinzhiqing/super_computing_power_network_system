// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

/**
* @title 使用权通证与市场链接
* @author yinzhiqing
* @notice 市场操作
* @dev 调用第三方市场操作
*/
interface ISCPNSMarketLink
{


    /** 
    * @notice 将使用权通证添加到市场
    * @dev 添加到市场合约
    */ 
    function putToMarket(uint256 tokenId, uint256 price) external;

    /** 
    * @notice 将使用权通证从市场撤销
    * @dev 从市场合约撤销
    */ 
    function revokeFromMarket(uint256 tokenId) external;

    /**
    * @notice 链中时戳精度，秒为1,且为最大精度值
    * @dev 不同链中时戳精度不同，秒为1 毫秒为1000
    * @return 精度值
    */
    function pricision() external view returns(uint256);
}
