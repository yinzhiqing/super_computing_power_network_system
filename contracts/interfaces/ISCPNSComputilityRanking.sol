// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

/**
* @title 算力排行
* @author yinzhiqing
* @notice 更新并显示算力排行
* @dev 算力排行数据由证明合约更新
*/
interface ISCPNSComputilityRanking 
{
    /** 
    * @notice 排行数据写入日志
    * @dev 可以根据写入日志的数据生成更多维度的排行
    * @param index 事件序号（0~n）, 递增
    * @param parameterId 排行数据对应的证明参数ID
    * @param tokenId 此处是使用权ID
    * @param preBlockNumber 上一个事件对应的块号
    * @param fixPreBlockNumber tokenId的上一个事件对应的块号
    * @param execTime 证明任务执行的事件（精度与链精度相同）
    * @param taskId 对应的证明任务Id
    */
    event Set(uint256 indexed index, uint256 indexed parameterId,  uint256 indexed tokenId, uint256 preBlockNumber, uint256 fixPreBlockNumber, uint256 execTime, uint256 taskId);

    /**
    * @notice 设置新的排行数据，并根据数据更新排行
    * @dev 此函数在算力证明合约中调用，不能从外部调用
    * @param tokenId 此处应该是使用权ID
    * @param start 证明任务开始时间，开始任务时候获取的块时戳
    * @param end 证明任务结束时间，完成任务时候获取的块时戳
    * @param parameterId 算力证明任务对应的参数ID
    * @param taskId 算力证明任务ID
    */
    function set(uint256 tokenId, uint256 start, uint256 end, uint256 parameterId, uint256 taskId) external;

    /**
    * @notice 判断指定的地址（普通用户，合约）对此合约具有CONTROLLER_ROLE权限
    * @dev 合约内部调用时，判定合约之间的调用关系
    * @param controller 设定具有CONTROLLER_ROLE的地址
    * @return 返回判定结果
    */
    function isController(address controller) external view returns(bool);

    /**
    * @notice 判定指定token在指定ParameterId和scale下所处位置
    * @dev 计算token在算力分布图中的位置
    * @param parameterId 证明参数ID
    * @param tokenId 使用权通证ID
    * @param scale 计算刻度(单位：秒)
    * @return 分布图中位置(横坐标)
    */
    function postionOf(uint256 parameterId, uint256 tokenId, uint256 scale) external view returns(uint256);

    /**
    * @notice 获取使用权通证的最后一次证明任务ID
    * @dev 获取使用权通证的最后一次证明任务ID（不区分证明参数）
    * @param tokenId是使用权通证ID
    * @return 最近一次证明任务ID
    */
    function lastTaskIdOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取指定使用权通证证明任务中涉及到的所有参数ID
    * @dev 获取的parameterId列表是指定使用权通证做过的证明任务用到的所有ParameteId
    * @param tokenId 使用权通证ID
    * @return parameterId列表
    */
    function parameterIdsOf(uint256 tokenId) external view returns(uint256[] memory);

    /**
    * @notice 获取指定证明参数支持的刻度列表
    * @dev scale是以1秒为1个最小单位的不同刻度
    * @param parameterId 是测量参数ID
    * @return 刻度列表
    */
    function scalesOf(uint256 parameterId) external view returns(uint256[] memory);

    /**
    * @notice 使用权通证使用指定证明参数执行证明任务后生成的最新排行数据存储在日志中关联的块序号
    * @dev 获取使用权通证关联的排行数据日志存储在event中块编号
    * @param parameterId 证明参数ID
    * @param tokenId 使用权通证ID
    * @return 块号
    */
    function lastBlockNumberOf(uint256 parameterId, uint256 tokenId) external view returns(uint256);

    /**
    * @notice 获取最后一次存储日志的块号
    * @dev 获取event日志时，最后一次存储日志的块号
    * @return 块号
    */
    function lastBlockNumber() external view returns(uint256);

    /**
    * @notice 获取排行数据表
    * @dev 获取指定算力类型在指定算力证明参数下指定刻度的排行数据
    * @param parameterId 算力证明参数ID
    * @param scale 指定算力刻度(秒)
    * @param typeUnitId 算力资源类型ID
    * @return keys 排行数据表时间值
    * @return values 排行数据表数量值
    */
    function excTimeDistTableOf(uint256 parameterId, uint256 scale, uint256 typeUnitId) external view returns(uint256[] memory keys, uint256[] memory values);

    /**
    * @notice 获取排行数据表历史数据
    * @dev 获取指定算力类型在指定算力证明参数下指定刻度的排行数据
    * @param parameterId 算力证明参数ID
    * @param scale 指定算力刻度(秒)
    * @param typeUnitId 算力资源类型ID
    * @return keys 排行数据表时间值
    * @return values 排行数据表数量值
    */
    function excTimeHistoryOf(uint256 parameterId, uint256 scale, uint256 typeUnitId) external view returns(uint256[] memory keys, uint256[] memory values);

    /** 
    * @notice 获取最后事件的序号
    * @dev 获取event的最新index
    * @return 事件序号
    */
    function lastEventIndex() external view returns(uint256);

    /**
    * @notice 获取排行数据数量
    * @dev 循环获取排行数据时最大的数据量
    * @param parameterId 算力证明参数ID
    * @param scale 指定算力刻度(秒)
    * @param typeUnitId 算力资源类型ID
    * @return 排行数据数量
    */
    function countOf(uint256 parameterId, uint256 scale, uint256 typeUnitId) external view returns(uint256);

    /**
    * @notice 获取历史排行数据数量
    * @dev 循环获取排行数据时最大的数据量
    * @param parameterId 算力证明参数ID
    * @param scale 指定算力刻度(秒)
    * @param typeUnitId 算力资源类型ID
    * @return 排行数据数量
    */
    function countOfHistory(uint256 parameterId, uint256 scale, uint256 typeUnitId) external view returns(uint256);

    /**
    * @notice 获取排行数据指定序号的数据对
    * @dev 循环获取排行数据时最大的数据量
    * @param parameterId 算力证明参数ID
    * @param scale 指定算力刻度(秒)
    * @param typeUnitId 算力资源类型ID
    * @return x 刻度值
    * @return y x对应的value值
    */
    function excTimeByIndex(uint256 parameterId, uint256 scale, uint256 typeUnitId, uint256 index) external view returns(uint256 x, uint256 y);

    /**
    * @notice 获取历史排行数据指定序号的数据对
    * @dev 循环获取历史排行数据时最大的数据量
    * @param parameterId 算力证明参数ID
    * @param scale 指定算力刻度(秒)
    * @param typeUnitId 算力资源类型ID
    * @return x 刻度值
    * @return y x对应的value值
    */
    function excTimeHistoryByIndex(uint256 parameterId, uint256 scale, uint256 typeUnitId, uint256 index) external view returns(uint256 x, uint256 y);

    /**
    * @notice 获取排行数据支持的所有证明参数列表
    * @dev 获取可用查询的parameterId列表
    * @return 证明参数ID列表
    */
    function parameters() external view returns(uint256[] memory);

    /**
    * @notice 获取排行数据支持的所有相关算力类型列表
    * @dev 获取可用查询的typeUnitId列表
    * @return 算力类型ID列表
    */
    function typeUnitIds() external view returns(uint256[] memory);

    /**
    * @notice 获取排行数据中指定证明参数对应的算力类型列表
    * @dev 获取排行数据中指定证明参数ID对应的算力类型ID列表
    * @param parameterId 算力证明参数ID
    * @return 算力类型ID列表
    */
    function typeUnitIdsOf(uint256 parameterId) external view returns(uint256[] memory);

    /**
    * @notice 链中时戳精度，秒为1,且为最大精度值
    * @dev 不同链中时戳精度不同，秒为1 毫秒为1000
    * @return 精度值
    */
    function pricision() external view returns(uint256);
}
