
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./ISCPNSBase.sol";

/**
* @title 使用权通证管理
* @author yinzhiqing
* @notice 算力使用权通证对应具体类型的算力资源
* @dev 算力使用权通证面对销售端，依赖于算力合约，被算力证明合约、算力排行、算力挑战使用
*/
interface ISCPNSUseRightToken is
    ISCPNSBase
{
    /**
    * @notice 创建新的使用权通证
    * @dev 创建使用权通证即将算力通证化
    * @param to 使用权拥有者
    * @param tokenId 使用权通证ID， 唯一
    * @param deadline 产品有效终止时间点（时间戳）
    * @param computilityVMs 算力列表, 算力类型必须一致, 重复ID会被忽略
    * @param datas 辅助数据（json格式字符串）
    */
    function mint(address to, uint256 tokenId, uint256 deadline,
                  uint256 computilityVMs, string memory datas) external;

    /**
    * @notice 获取算力资源ID
    * @dev 根据算力使用权通证获取对应的算力资源
    * @param tokenId 算力使用权通证ID
    * @return 算力类型ID
    */
    function typeUnitIdOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取算力类型
    * @dev 根据算力使用权通证获取对应的算力类型
    * @param tokenId 算力使用权通证ID
    * @return 算力类型ID
    */
    function computilityVMIdOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取算力使用权中算力数量
    * @dev 算力数据量是统计mint中computilityVMS指定的数量
    * @param tokenId 使用权通证ID
    * @return 数量
    */
    function typeUnitCountOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取使用权通证拥有者
    * @dev 获取指定使用权通证所属用户地址
    * @param tokenId 使用权通证ID
    * @return 拥有者地址
    */
    function ownerOf(uint256 tokenId) external view returns(address);

    /**
    * @notice 获取使用权通证的有效终止时间点
    * @dev 使用权通证的有效终止时间点在mint中设置
    * @param tokenId 使用权通证ID
    * @return 终止时间点（秒）
    */
    function deadLine(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 重新设置使用权通证的有效终止时间点(生命时间)
    * @dev 重新设置使用权通证的有效终止时间
    * @param tokenId 使用权通证ID
    * @param lifeTime 生命时间(秒)
    */
    function resetLifeTime(uint256 tokenId, uint256 lifeTime) external;

    /**
    * @notice 延长终止时间点, 在现有时间基础上增加指定的时间(times)
    * @dev 延长使用权通证的有效终止时间
    * @param tokenId 使用权通证ID
    * @param times 续约时间(秒)
    */
    function renewal(uint256 tokenId, uint256 times) external;

    /**
    * @notice  确认使用权通证是否有效
    * @dev 使用权通证有效性根据deadline 与 块时间戳比较判定
    * @param tokenId 使用权通证ID
    * @return 有效性标志
    */
    function isValid(uint256 tokenId) external view returns(bool);

    /**
    * @notice 获取使用权通证对应的证明参数
    * @dev 合约根据使用权通证对应的算力类型获取对应的证明参数
    * @param tokenId 使用权通证ID
    * @return 证明参数ID
    */
    function parameterIdOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取使用权通证关联的算力资源对应的收益权份额值
    * @dev 根据算力使用权获取对应的算力资源类型对应的收益权份额值，算力资源可能包含多个算力类型单元
    * @param tokenId 使用权通证ID
    * @return 收益权份额值
    */
    function revenueValueOf(uint256 tokenId) external view returns(uint256);

    //test
    function changeAdmin(address newAdmin) external;
    function revoke(address from, address to, uint256 tokenId) external;
    function gpuTypeOf(uint256 tokenId) external view returns (uint16);
}
