
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

/**
* @title 算力资源管理
* @author yinzhiqing
* @notice 算力管理即管理算力资源
* @dev 算力管理合约是算力使用权通证的基础，依赖算力单元合约
*/
interface ISCPNSComputilityVM is 
    ISCPNSBase
{

    /**
    * @notice 创建新的算力
    * @dev 发起交易者需要有MINTER_ROLE权限, 算力包括一定数量的算力单元
    * @param to 算力拥有者钱包地址
    * @param tokenId 算力ID，唯一
    * @param deadline 算力有效期终止时间（时戳：秒）
    * @param computilityUnits 算力单元列表
    * @param counts 算力单元数量，与computilityUnits对应（key-value形式）
    * @param datas 辅助数据
    */
    function mint(address to, uint256 tokenId, uint256 deadline, 
                  uint256[] memory computilityUnits, uint256[] memory counts, string memory datas) external;

    /**
    * @notice 改变算力使用者
    * @dev 算力在整个生命周期内(< deadline)，在不同的时段可能属于不同的使用者
    * @param to 使用者地址
    * @param tokenId 算力ID
    */
    function changeUser(address to, uint256 tokenId) external;

    /**
    * @notice 所属算力类型ID
    * @dev 一个算力只能绑定一个算力类型
    * @param tokenId 算力ID
    * @return 算力类型ID
    */
    function typeUnitIdOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取包含算力类型资源数量
    * @dev 可以包含1个以上的算力类型
    * @param tokenId 算力ID
    * @return 算力资源数量
    */
    function typeUnitCountOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 锁定算力到指定的时间
    * @dev 使指定的算力在指定时间点之前不能被重新使用
    * @param tokenId 算力ID
    * @param lockLine 锁定终止时戳（精度与链精度一致）
    */
    function lockResources(uint256 tokenId, uint256 lockLine) external;

    /**
    * @notice 重新设定锁定算力到指定的时间
    * @dev 重新设定锁定时间使指定的算力在指定时间点之前不能被重新使用
    * @param tokenId 算力ID
    * @param lockLine 锁定终止时戳（精度与链精度一致）
    */
    function resetLockLine(uint256 tokenId, uint256 lockLine) external;
    /**
    * @notice 获取算力可使用终止时间（时戳，精度与链精度一致）
    * @dev 使用终止日，即以时戳形式表示的终止时间点
    * @param tokenId 算力ID
    * @return 终止时间（时戳）
    */
    function deadLine(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取算力单元数量
    * @dev 获取的算力单元, 是算力配置中最小可配置单元
    * @param tokenId 算力ID
    * @return 算力单元ID
    */
    function computilityUnitCountOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取算力的算力单元列表中指定序号的算力单元
    * @dev 一个算力包括1个或多个算力单元，可以根据需要获取指定的算力单元
    * @param tokenId 算力ID
    * @param index 算力单元列表中序号
    * @return 算力单元ID
    */
    function computilityUnitIdByIndex(uint256 tokenId, uint256 index) external view returns(uint256);

    /**
    * @notice 判定算力是否自由状态
    * @dev 一个算力未被锁定，或不在锁定期限内则处于free状态，否则为no-free. free状态则可创建新的使用权通证
    * @param tokenId 算力ID
    * @return 状态
    */
    function isFree(uint256 tokenId) external view returns(bool);


    /**
    * @notice 获取算力资源获取收益权份额值
    * @dev 根据算力资源类型获取对应的收益权份额值，算力资源可能包含多个算力类型单元
    * @param tokenId 算力资源ID
    * @return 收益权份额值
    */
    function revenueValueOf(uint256 tokenId) external view returns(uint256);
}
