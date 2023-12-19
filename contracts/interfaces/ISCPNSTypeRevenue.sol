// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

/**
* @title 证明任务参数管理
* @notice 设置不同类型资源执行证明任务时使用的参数
* @dev 证明任务参数一旦设置不能修改，不能删除，否则依赖此数据的其它合约将出现数据不完整问题
*/
interface ISCPNSTypeRevenue is 
    ISCPNSBase
{
    /**
    * @notice 创建新的收益值
    * @dev 创建新的收益值时，应该将设置的值以json的格式存储到datas中，这方便的链外读取操作
    * @param tokenId 收益值ID， 唯一
    * @param name_ 收益值名称， 唯一
    * @param value 可分配份儿值
    * @param datas 辅助信息json格式
    */
    function mint(uint256 tokenId, bytes32 name_, uint256 value, string memory datas) external;

    /**
    * @notice 设置算力类型对应的默认收益值，实现证明任务参数设置自动化
    * @dev 将算力类型与收益值进行绑定，可以通过算力类型获取对应的参数，实现证明时间控制
    * @param typeUnitId 算力类型ID（SCPNSTypeUnit中存储）
    * @param tokenId 收益值ID
    */
    function setDefaultTokenOf(uint256 typeUnitId, uint256 tokenId) external;

    /**
    * @notice 设置收益值支持的算力类型及执行算力证明的有效时间范围
    * @dev 设置不同类型算力用不同参数参数证明算力资源能力时应该满足的性能（证明时间在指定时间内）
    * @param tokenId 收益值ID
    * @param typeUnitId 算力类型ID（SCPNSTypeUnit中存储）
    * @param min 最小时间（经验值）, 时间单位：秒
    * @param max 最大时间（经验值）, 时间单位：秒
    */
    function setComputilityRange(uint256 tokenId, uint256 typeUnitId, uint256 min, uint256 max) external;

    /**
    * @notice 获取收益值
    * @dev 获取指定参数信息，json格式存储，算力证明时用来设置参数
    * @param tokenId 收益值ID
    * @return 收益份儿值
    */
    function rvalueOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取算力类型适用的收益值
    * @dev 每个算力类型对应的收益值在setDefaultTokenOf中设置
    * @param typeUnitId 算力类型ID
    * @return 收益值
    */
    function valueOfTypeUnitId(uint256 typeUnitId) external view returns(uint256);

    /**
    * @notice 获取算力类型适用的收益值ID
    * @dev 每个算力类型对应的收益值ID在setDefaultTokenOf中设置
    * @param typeUnitId 算力类型ID
    * @return 收益值ID
    */
    function tokenIdOfTypeUnitId(uint256 typeUnitId) external view returns(uint256);

    /**
    * @notice 获取算力类型使用指定收益值执行算力证明有效时间范围
    * @dev 获取算力类型证明有效时间范围是由setComputilityRange设定的值
    * @param tokenId 收益值ID
    * @param typeUnitId 算力类型ID（SCPNSTypeUnit中存储）
    */
    function computilityRangeOfTypeUnit(uint256 tokenId, uint256 typeUnitId) external view returns(uint256 min, uint256 max);

    /**
    * @notice 支持的所有算力类型列表
    * @dev 算力类型列表是setDefaultTokenOf设置时设置的所有值, setComputilityRange中设置的算力类型未包含
    * @return 算力类型列表
    */
    function typeUnitIds() external view returns(uint256[] memory);
}
