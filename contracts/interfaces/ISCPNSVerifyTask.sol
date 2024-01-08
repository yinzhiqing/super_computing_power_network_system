// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

/**
* @title 挑战任务
* @author yinzhiqing
* @notice 链上完成证明任务生成Merkle树的有效性
* @dev 挑战任务根据证明任务随机生成挑战问题，有算力节点回答问题
*/
interface ISCPNSVerifyTask is 
    ISCPNSBase
{
    /**
    * @notice 挑战统计
    * @dev 统计某种类型算力挑战信息
    */
    struct VerifyStat {
        uint256 total;
        uint256 success;
        uint256 failed;
    }

    /**
    * @notice 挑战状态
    * @dev 挑战状态表明挑战任务不同状态，
    *      None: 未开始挑战
    *      Start: 挑战开始
    *      Verify: 挑战进行中
    *      End: 挑战完成
    *      Failed: 挑战失败
    *      Error: 挑战出错
    */
    enum VerifyState {None, Start, Verify, End, Failed, Error}

    /**
    * @notice 挑战参数及问题结果
    * @dev 一个证明任务对应一个挑战参数及结果,
    *      tokenId: 挑战任务ID
    *      proofId: 证明任务ID
    *      startBlockNumber: 挑战开始块号
    *      verifyBlockNumber: 接收挑战最后一个块号
    *      endBlockNumber: 结束挑战块号
    *      sender: 发起挑战者
    *      state: 挑战任务状态
    *      q: 问题
    *      a: 答案
    *      stat: 本次证明任务挑战信息统计
    */
    struct VerifyParameter {
        uint256 tokenId;
        uint256 proofId;
        uint256 startBlockNumber;
        uint256 verifyBlockNumber;
        uint256 endBlockNumber;
        address sender;
        VerifyState state;
        bytes32 q;
        bytes32 a;
        VerifyStat stat;
    }

    /**
    * @notice 事件记录
    * @dev 挑战任务信息日志存储
    * @param index 事件序号
    * @param useRightId 使用权通证
    * @param preBlockNumber 上一个事件块号
    * @param sender 挑战发起者
    * @param vp 本地挑战参数及结果
    * @param datas 附加信息
    */
    event TaskData(uint256 indexed index, uint256 indexed useRightId, 
                   uint256 preBlockNumber,  address sender, VerifyParameter vp, string datas);

    /**
    * @notice 创建挑战任务
    * @dev mint新的挑战任务
    * @param useRightId 使用权通证ID（接收任务的使用权通证）
    * @param proofId 证明任务ID
    * @param datas 附加信息
    */
    function mint(uint256 useRightId, uint256 proofId, string memory datas) external;

    /**
    * @notice 完成一次挑战
    * @dev 完成一次挑战，并生成下次挑战
    * @param tokenId 挑战任务Id
    * @param a 回答问题与q相同
    * @param proof 问题对应的路径
    * @param pos 路径中节点对应的位置 true: left false: right
    */
    function taskVerify(uint256 tokenId, bytes32 a, bytes32[] memory proof, bool[] memory pos) external;

    /**
    * @notice 更新开始到结束等待块数
    * @dev 等待块数可确定完成证明有效时间
    * @param newBlockNumber 等待块数
    */
    function updateWaitBlockNumber(uint256 newBlockNumber) external;

    /**
    * @notice 挑战任务是否正常结束(挑战成功)
    * @dev 任务状态是End则任务任务结束, 即完成了所有挑战
    * @param tokenId 任务ID
    * @return 状态值 true:挑战正常结束 false: 未完成挑战
    */
    function isVerified(uint256 tokenId) external view returns(bool);
    
    /**
    * @notice 挑战任务当前状态(超过最大运行时候判定为Error)
    * @dev 根据目前条件判定状态
    * @param tokenId 任务ID
    * @return 状态值 VerifyState
    */
    function verifyState(uint256 tokenId) external view returns(VerifyState);
    
    /**
    * @notice 使用权通证是否可以发起挑战
    * @dev 使用通证是否可以发起挑战（证明中、挑战中、 没有执行过证明任务都不能发起挑战）
    * @param tokenId 使用权通证ID
    * @return 是否发起挑战结果 true: 可以 false: 不可以
    */
    function canVerifyOfUseRightId(uint256 tokenId) external view returns(bool);

    /**
    * @notice 获取使用权通证证明任务(最近)参数
    * @dev 使用权通证同一时间段只能有一个证明任务，证明任务参数最后一次有效
    * @param tokenId 使用权通证ID
    * @return dynamicData 随机数据
    * @return parameter 证明参数
    * @return proofId 证明任务ID
    * @return has 是否存在证明参数（合约总会返回以上值，无论是否存在）
    */
    function proofParametersByUseRightId(uint256 tokenId) external view returns(
        bytes32 dynamicData, string memory parameter, uint256 proofId, bool has);

    /**
    * @notice 使用权通证是否有执行中挑战任务
    * @dev 挑战任务状态是Start或Verify都任务有执行中的挑战任务
    * @param useRightId 使用权通证ID
    * @return 存在状态 true: 存在 false: 不存在
    */
    function hasVerifyTask(uint256 useRightId)  external view returns(bool); 

    /**
    * @notice 任务剩余挑战次数
    * @dev 一次证明任务需要接收挑战次数由参数(proofPrameter)确定
    * @param tokenId 任务ID
    * @return 剩余次数
    */
    function residueVerifyOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 使用权通证当前挑战任务参数
    * @dev 挑战任务参数中参数在挑战过程中部分内容会发生变化(例如q 次数 状态等)
    * @param useRightId 使用权通证ID
    * @return tokenId 挑战任务ID
    * @return q 挑战问题（叶子节点hash）
    * @return state 任务状态
    */
    function verifyParameterOfUseRightId(uint256 useRightId) external view returns(
        uint256 tokenId, bytes32 q, VerifyState state);

    /**
    * @notice 任务参数
    * @dev 在挑战中的任务部分内容会发生变化(例如q 次数 状态等), 已经结束的任务，参数不会发生改变
    * @param tokenId 任务ID
    * @return useRightId 使用权通证ID
    * @return q 挑战问题
    * @return state 任务状态
    */
    function verifyParameterOf(uint256 tokenId) external view returns(
        uint256 useRightId, bytes32 q, VerifyState state);

    /**
    * @notice 挑战统计信息
    * @dev 对于同一个使用权通证挑战次数统计，所有证明涉及的挑战信息汇总(total >= success + failed)
    * @param useRightId 使用权通证ID
    * @return total 挑战总次数
    * @return success 成功完成挑战次数
    * @return failed 失败次数
    */
    function verifyStatOfUseRightId(uint256 useRightId) external view returns(
        uint256 total, uint256 success, uint256 failed);

    /**
    * @notice 单次挑战任务统计信息
    * @dev 一次证明任务对应的挑战信息(total >= success + failed)
    * @param tokenId 任务ID
    * @return total 挑战总次数
    * @return success 成功完成挑战次数
    * @return failed 失败次数
    */
    function verifyStatOf(uint256 tokenId) external view returns(
        uint256 total, uint256 success, uint256 failed);

    /**
    * @notice 获取挑战任务所属使用权通证
    * @dev 挑战任务必定对应唯一的使用权通证
    * @param tokenId 任务ID
    * @return 使用权通证ID
    */
    function useRightIdOf(uint256 tokenId) external view returns(uint256);

    /**
    * @notice 判定是否在挑战中
    * @dev 判定指定的任务是否正在执行挑战
    * @param tokenId 任务ID
    * @return 状态信息 true: 挑战中
    */
    function isInVerifyOf(uint256 tokenId) external view returns(bool);

    /**
    * @notice 判定是否在挑战中
    * @dev 判定指定的任务是否正在执行挑战
    * @param tokenId 使用权通证ID
    * @return 状态信息 true: 挑战中
    */
    function isInVerifyOfUseRightId(uint256 tokenId) external view returns(bool);

    /**
    * @notice 事件数量
    * @dev 事件数量是根据事件索引查询日志的条件
    * @return 数量值
    */
    function eventCountOf() external view returns(uint256);

    /**
    * @notice 获取指定值的sha256结果
    * @dev 可测试
    * @return hash值
    */
    function sha256Of(bytes memory data) external view returns(bytes32);

    /**
    * @notice 获取随机值
    * @dev 挑战发起时根据证明参数，随机选择一个叶子序号, 可根据采样数在不同的采样区获取值（增加分散性）, 
    * 相同块内生成的值不变（参数相同）
    * @param leafCount 叶子数量
    * @param sample 采样数
    * @param index 采样需要（index < sample）
    * @return 叶子序号
    */
    function randIndex(uint256 leafCount, uint256 sample, uint256 index) external view returns(uint256);

    /**
    * @notice 生成叶子hash
    * @dev 根据参数生成叶子hash
    * @param dynamicData 随机数据(证明参数)
    * @param index 叶子序号（可由randIndx产生）
    * @param leaf_deep 叶子hash深度
    * @param useSha256 是否使用sha256， 默认keccak256
    * @return hash值
    */
    function createLeaf(bytes32 dynamicData, uint256 index, uint256 leaf_deep, bool useSha256) external view returns(bytes32);
}
