// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

/**
* @title  算力证明任务
* @notice 算力证明任务管理, 实现算力证明任务参数链上生成，结果链上验证.
*         流程：
*           1. 使用权拥有者发起证明任务(调用智能合约接口)。
            2. 智能合约生成证明参数
            3. 算力节点执行算力证明，生成Merkle树，并将Merkle根作为参数调用智能合约接口结束证明
            4. 智能合约更新证明状态，调用挑战合约生成第一个挑战，同时更新排行数据
            5. 算力节点完成挑战（挑战次数由证明参数确定), 多次挑战是串型完成。
            6. 完成挑战则，证明完成。
* @dev    算力证明任务更新算力排行，依赖证明参,使用权通证
*/
interface ISCPNSProofTask is 
    ISCPNSBase 
{
    /** 
    * @notice 任务状态
    * @dev 任务状态是0~4的整数值， 
    *      None: 表示没有设置
    *      Manual: 表示手动执行
    *      Auto: 表示由链自动发起
    *      Type3， Type4: 扩展用
    */
    enum TaskType {None, Manual, Auto, Type3, Type4}

    /**
    * @notice 任务参数结构
    * @dev 结构中存储每个任务对应的证明参数，随机数据及任务类型
    */
    struct TaskParameter {
        uint256  parameterId;
        bytes32  dynamicData;
        TaskType taskType;
    }

    /**
    * @notice 任务状态
    * @dev 任务状态是0~5的整数值，
    *      None: 表示没有设置
    *      Start: 发起证明任务
    *      End： 表示证明任务结束
    *      Cancel： 表示证明任务被取消
    *      ERROR: 表示证明任务失败
    */
    enum TaskState {None, Start, End, Cancel, ERROR}

    /**
    * @notice 任务详细信息
    * @dev 任务详细信息是描述任务完成情况的信息，
    *      tokenId: 任务ID
    *      start: 开始事件
    *      end: 结束时间
    *      merkleRoot: 证明数据Merkle树根
    *      state: 任务状态
    *      useSha256: merkle树中hash函数类型： sha256、keccak256(默认)
    */
    struct TaskDetail {
        uint256 tokenId;
        uint256 start;
        uint256 end;
        bytes32 merkleRoot;
        TaskState state;
        bool    useSha256;
    }

    /**
    * @notice 证明任务事件
    * @dev 存储证明任务信息到日志中
    * @param index 日志序号
    * @param useRightId 使用权通证ID
    * @param taskId 任务ID
    * @param preBlockNumber 上一个事件块号
    * @param sender 发起事件者
    * @param taskParameter 任务参数
    * @param taskDetail 任务信息
    * @param datas 辅助信息(json格式)
    */
    event TaskData(uint256 indexed index, uint256 indexed useRightId, uint256 indexed taskId, 
                   uint256 preBlockNumber,  address sender, TaskParameter taskParameter, TaskDetail taskDetail, string datas);

    /**
    * @notice 创建算力证明任务
    * @dev 算力通证拥有者创建新的证明任务
    * @param to 任务执行者
    * @param useRightId 使用权通证
    * @param q 问题
    * @param datas 辅助信息(json字符串)
    */
    function mint(address to, uint256 useRightId, bytes32 q, string memory datas) external ;

    /**
    * @notice 结束任务
    * @dev 结束证明任务，发起任务者或任务执行者有此权限
    * @param tokenId 任务ID
    * @param merkleRoot 证明任务生成的Merkle树根
    * @param a 答案
    * @param useSha256 hash函数类型： true是sha256 false是keccak256
    */
    function taskEnd(uint256 tokenId, bytes32 merkleRoot, bytes32 a, bool useSha256) external;

    /**
    * @notice 取消任务
    * @dev 只有发起任务者可以取消任务
    * @param tokenId 任务ID
    */
    function taskCancel(uint256 tokenId) external;

    /**
    * @notice 更新保留任务数量
    * @dev 保存任务数量越多，对合约存储空间需求越大，默认保存3个
    * @param keepCount 保存任务数量
    */
    function updateKeepTaskCount(uint256 keepCount) external;

    /**
    * @notice 事件数量
    * @dev 事件数量即当前事件序号 + 1
    * @return 事件数量
    */
    function eventCountOf() external view returns(uint256);

    /**
    * @notice 最近一次证明任务参数
    * @dev 使用权通证最近一次任务参数
    * @param tokenId 使用权通证ID
    * @return dynamicData 随机数据
    * @return parameter 证明参数
    * @return taskId 证明任务ID
    * @return has 是否存在证明参数标志(总是村存在返回值)
    */
    function latestParametersByUseRightId(uint256 tokenId) external view returns(
        bytes32 dynamicData, string memory parameter, uint256 taskId, bool has);

    /** 
    * @notice 获取证明任务参数
    * @dev 根据任务ID获取任务参数
    * @param tokenId 使用权通证ID
    * @return dynamicData 随机数据
    * @return parameter 证明参数
    */
    function parameterOf(uint256 tokenId) external view returns(
        bytes32 dynamicData, string memory parameter);

    /**
    * @notice 获取使用权通证对应的最近一次任务信息
    * @dev 获取使用权通证对应的最近一次任务信息, 参照结构
    * @param tokenId 使用权通证ID
    * @return parameter 任务参数
    * @return result 任务结果信息
    */
    function latestTaskDataByUseRightId(uint256 tokenId) external view returns(
        TaskParameter memory parameter, TaskDetail memory result);
    function taskDataOfUseRightId(uint256 tokenId, uint256 index) external view returns(
        TaskParameter memory parameter, TaskDetail memory result);
    function taskDataCountOfUseRightId(uint256 tokenId) external view returns(uint256);
    function taskDataOf(uint256 tokenId) external view returns(
        TaskParameter memory parameter, TaskDetail memory result);
    function useRightIdOf(uint256 tokenId) external view returns(uint256);
    function isInProofOf(uint256 tokenId) external view returns(bool);
    function isInProofOfUseRightId(uint256 tokenId) external view returns(bool);
    function merkleRootOf(uint256 tokenId) external view returns(bytes32);
    function useSha256Of(uint256 tokenId) external view returns(bool);
}
