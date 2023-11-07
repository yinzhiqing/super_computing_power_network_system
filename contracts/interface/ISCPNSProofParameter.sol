
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

/**
* @title 证明任务参数管理
* @notice 设置不同类型资源执行证明任务时使用的参数
* @dev 证明任务参数一旦设置不能修改，不能删除，否则依赖此数据的其它合约将出现数据不完整问题
*/
interface ISCPNSProofParameter is 
    ISCPNSBase
{
    /**
    * @notice 创建新的证明参数
    * @dev 创建新的证明参数时，应该将设置的值以json的格式存储到datas中，这方便的链外读取操作
    * @param tokenId 证明参数ID， 唯一
    * @param name_ 证明参数名称， 唯一
    * @param parameter 参数字符串， json格式的string格式
    * @param pnames 参数名称列表与pvalues对应
    * @param pvalues 参数值列表月pnames对应
    * @param datas 辅助信息json格式
    */
    function mint(uint256 tokenId, bytes32 name_, string memory parameter, string[] memory pnames, uint256[] memory pvalues, string memory datas) external;

    /**
    * @notice 设置算力类型对应的默认证明参数，实现证明任务参数设置自动化
    * @dev 将算力类型与证明参数进行绑定，可以通过算力类型获取对应的参数，实现证明时间控制
    * @param typeUnitId 算力类型ID（SCPNSTypeUnit中存储）
    * @param tokenId 证明参数ID
    */
    function setDefaultTokenOf(uint256 typeUnitId, uint256 tokenId) external;

    /**
    * @notice 设置证明参数支持的算力类型及执行算力证明的有效时间范围
    * @dev 设置不同类型算力用不同参数参数证明算力资源能力时应该满足的性能（证明时间在指定时间内）
    * @param tokenId 证明参数ID
    * @param typeUnitId 算力类型ID（SCPNSTypeUnit中存储）
    * @param min 最小时间（经验值）, 时间单位：秒
    * @param max 最大时间（经验值）, 时间单位：秒
    */
    function setComputilityRange(uint256 tokenId, uint256 typeUnitId, uint256 min, uint256 max) external;

    /**
    * @notice 获取证明参数
    * @dev 获取指定参数信息，json格式存储，算力证明时用来设置参数
    * @param tokenId 证明参数ID
    */
    function parameterOf(uint256 tokenId) external view returns(string memory);

    /**
    * @notice 获取指定证明参数下单个参数值
    * @dev 获取mint时pnames中某个参数的值
    * @param tokenId 证明参数ID
    * @param name 单个参数名称
    */
    function valueOf(uint256 tokenId, string memory name) external view returns(uint256);

    /**
    * @notice 获取算力类型适用的证明参数ID
    * @dev 每个算力类型对应的证明参数在setDefaultTokenOf中设置
    * @param typeUnitId 算力类型ID
    * @return 证明参数ID
    */
    function parameterIdOfTypeUnitId(uint256 typeUnitId) external view returns(uint256);

    /**
    * @notice 获取算力类型使用指定证明参数执行算力证明有效时间范围
    * @dev 获取算力类型证明有效时间范围是由setComputilityRange设定的值
    * @param tokenId 证明参数ID
    * @param typeUnitId 算力类型ID（SCPNSTypeUnit中存储）
    */
    function computilityRangeOfTypeUnit(uint256 tokenId, uint256 typeUnitId) external view returns(uint256 min, uint256 max);

    /**
    * @notice 支持的所有算力类型列表
    * @dev 算力类型列表是setDefaultTokenOf设置时设置的所有值, setComputilityRange中设置的算力类型未包含
    * @return 算力类型列表
    */
    function typeUnitIds() external view returns(uint256[] memory);

    /**
    * @notice 获取证明参数中的采样数
    * @dev 获取证明参数中的采样数是本版本必须存在的参数，算力挑战合约中会用到此值
    * @param tokenId 证明参数ID
    * @return 采样数
    */
    function sampleOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取证明参数中的叶子节点数量
    * @dev 获取证明参数中的叶子节点数是本版本必须存在的参数，算力挑战合约中会用到此值
    * @param tokenId 证明参数ID
    * @return 叶子数
    */
    function leafCountOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取证明参数中生成叶子节点值需要执行hash操作的次数
    * @dev 获取证明参数中的hash操作次数是本版本必须存在的参数，算力挑战合约中会用到此值
    * @param tokenId 证明参数ID
    * @return hash操作的次数
    */
    function leafDeepOf(uint256 tokenId) external view returns(uint256);
}
