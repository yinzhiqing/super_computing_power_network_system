
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./SCPNSBase.sol";
import "./interface/ISCPNSProofTask.sol";
import "./interface/ISCPNSUseRightToken.sol";
import "./interface/ISCPNSProofParameter.sol";
import "./interface/ISCPNSComputilityRanking.sol";
import "./ContractProject.sol";
import "./PairValues.sol";
import "./ArraryUint256.sol";

contract SCPNSProofTask is 
SCPNSBase, 
ContractProject,
ISCPNSProofTask
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using ArrayUnit256 for ArrayUnit256.Uint256s;

    // Per-UseRightToken keep count of task
    uint256 public keepTaskCountOfUseRightId;

    // The block number where the previous event was located.
    uint256 private _preBlockNumber;
    // Task index(0~n)
    CountersUpgradeable.Counter private _eventIndex;
    // Task Id Generator
    CountersUpgradeable.Counter private _idGenerator;
    // Mapping from task id to parameter
    mapping (uint256 => TaskParameter) private _id2TaskParameter;
    // Mapping from task id to task Detail
    mapping (uint256 => TaskDetail) private _id2TaskDetail;
    // Mapping from task id to use right id
    mapping (uint256 => uint256) private _id2useRightId;
    // Mapping from use right id to task id list;
    mapping (uint256 => uint256[]) private _useRightId2TaskIds;
    // Mapping from id to question(q)
    mapping (uint256 => bytes32) private _id2Question;
    // Mapping from sender to id
    mapping (address => ArrayUnit256.Uint256s) private _ownedTokens;

    function initialize(address dns) 
    initializer 
    public 
    {
        __SCPNSProofTask_init(dns);

    }
    function __SCPNSProofTask_init(address dns)
    internal 
    initializer 
    {
        __SCPNSBase_init("SCPNSProofTask", "SCPNSProofTask", "");
        __ContractProject_init(dns);
        __SCPNSProofTask_init_unchained();
    }

    function __SCPNSProofTask_init_unchained() 
    internal initializer 
    {
        _unitType("prooftask");

        keepTaskCountOfUseRightId = type(uint256).max;
    }

    function mint(address to, uint256 useRightId, bytes32 q, string memory datas) public virtual override whenNotPaused {
        require(_msgSender() == _useRightTokenIf().ownerOf(useRightId) 
            || hasRole(MANAGER_ROLE, _msgSender()), 
            "SCPNSProofTask: The sender is onwer of useRightId or sender has MANAGER_ROLE role.");

        require(!SCPNSProofTask.isInProofOfUseRightId(useRightId), "SCPNSProofTask: useRight token is in proof");

        uint256 tokenId = _idGenerator.current();
        _mint(to, tokenId, NO_NAME, datas);


        TaskParameter storage tp = _id2TaskParameter[tokenId];
        tp.taskType = TaskType.Manual;
        tp.dynamicData = __prefixed(keccak256(abi.encodePacked(block.timestamp, _msgSender(), tokenId, tp.taskType)));
        tp.parameterId = __selectParameterId(useRightId);

        TaskDetail storage td = _id2TaskDetail[tokenId];
        td.tokenId = tokenId;
        td.start = block.timestamp;
        td.state = TaskState.Start;

        _useRightId2TaskIds[useRightId].push(tokenId);
        _id2useRightId[tokenId] = useRightId;

        _id2Question[tokenId] = q;

        //purge some data in memory
        _purgeMemory(useRightId, keepTaskCountOfUseRightId);
        emit TaskData(_eventIndex.current(), useRightId, tokenId, _preBlockNumber, _msgSender(), tp, td, datas);

        // next mint use 
        _idGenerator.increment();
        _preBlockNumber = block.number;
        _eventIndex.increment();
        _ownedTokens[_msgSender()].add(tokenId);
    }

    function taskEnd(uint256 tokenId, bytes32 merkleRoot, bytes32 a) public virtual override whenNotPaused {
        uint256 useRightId = _id2useRightId[tokenId];
        require(_exists(tokenId), "SCPNSProofTask: token is nonexists");
        require(_msgSender() == _useRightTokenIf().ownerOf(_id2useRightId[tokenId]) || _msgSender() == super.ownerOf(tokenId), 
                "SCPNSProofTask: sender has not use-right, and is not owner of tokenId ");
        require(_id2TaskDetail[tokenId].state == TaskState.Start, 
                "SCPNSProofParameter: task state is not Start, can't change.");

        _checkA(tokenId, a);

        TaskParameter storage tp = _id2TaskParameter[tokenId];
        TaskDetail    storage td = _id2TaskDetail[tokenId];

        td.end          = block. timestamp;
        td.state        = TaskState.End;
        td.merkleRoot   = merkleRoot;

        _updateComputilityRanking(_id2useRightId[tokenId], tp, td);

        emit TaskData(_eventIndex.current(), useRightId, tokenId, _preBlockNumber, _msgSender(), tp, td, "");

        // next event use 
        _preBlockNumber = block.number;
        _eventIndex.increment();

    }

    function _updateComputilityRanking(uint256 tokenId, TaskParameter storage parameter, TaskDetail storage detail) internal {
        _computilityRankingIf().set(tokenId, detail.start, detail.end, parameter.parameterId, detail.tokenId);

    }

    function taskCancel(uint256 tokenId) public virtual override whenNotPaused {
        uint256 useRightId = _id2useRightId[tokenId];
        require(_exists(tokenId), "SCPNSProofTask: token is nonexists");
        require(hasRole(MINTER_ROLE, _msgSender()), "SCPNSProofTask: must have minter role to add");
        require(_msgSender() == _useRightTokenIf().ownerOf(_id2useRightId[tokenId]), 
                "SCPNSProofTask: tokenId owner is not sender");
        require(_id2TaskDetail[tokenId].state == TaskState.Start, 
                "SCPNSProofParameter: task state is not Start, can't cancel");

        TaskParameter storage tp = _id2TaskParameter[tokenId];
        TaskDetail storage td = _id2TaskDetail[tokenId];
        td.state = TaskState.Cancel;

        emit TaskData(_eventIndex.current(), useRightId, tokenId, _preBlockNumber, _msgSender(), tp, td, "");

        // next event use 
        _preBlockNumber = block.number;
        _eventIndex.increment();
    }

     function updateKeepTaskCount(uint256 keepCount) public virtual override whenNotPaused {
        require(hasRole(MANAGER_ROLE, _msgSender()), "SCPNSProofTask: must have manager role to add");
        require(keepCount > 0, "SCPNSProofTask: The minimum value of a is 1.");
        keepTaskCountOfUseRightId = keepCount;
     }

    function eventCountOf() public view virtual override returns(uint256) {
        return _eventIndex.current();
    }

    function useRightIdOf(uint256 tokenId) public view virtual override returns(uint256) {
        return _id2useRightId[tokenId];
    }

    function isInProofOf(uint256 tokenId) public view virtual override returns(bool) {
        require(_exists(tokenId), "SCPNSProofTask: token is nonexists");
        return _id2TaskDetail[tokenId].state == TaskState.Start;
    }

    function isInProofOfUseRightId(uint256 tokenId) public view virtual override returns(bool) {
        require(_useRightTokenIf().exists(tokenId), "SCPNSProofTask: useRight token is nonexists");

        uint256[] storage taskIds = _useRightId2TaskIds[tokenId];
        if (taskIds.length > 0) {
            uint256 taskId = _useRightId2TaskIds[tokenId][taskIds.length -1];
            TaskDetail storage td = _id2TaskDetail[taskId];
            return td.state == TaskState.Start;
        }
        return false;
    }

    function latestParametersByUseRightId(uint256 tokenId) 
        public view virtual override returns( bytes32 dynamicData, string memory parameter, uint256 taskId, bool has) {

        require(_useRightTokenIf().exists(tokenId), "SCPNSProofTask: useRight token is nonexists");

        uint256[] storage taskIds = _useRightId2TaskIds[tokenId];

        has = taskIds.length > 0;
        if (has) {
            taskId = taskIds[taskIds.length - 1];
            (dynamicData, parameter) = SCPNSProofTask.parameterOf(taskId);
        }
    }

    function parameterOf(uint256 tokenId) public view virtual override returns(bytes32 dynamicData, string memory parameter) {
        require(_exists(tokenId), "SCPNSProofTask: token is nonexists");

        TaskParameter storage tp = _id2TaskParameter[tokenId];
        dynamicData = tp.dynamicData;
        parameter = _proofParameterIf().parameterOf(tp.parameterId);
    }

    function latestTaskDataByUseRightId(uint256 tokenId) 
        public view virtual override returns(TaskParameter memory parameter, TaskDetail memory result) {

        require(_useRightTokenIf().exists(tokenId), "SCPNSProofTask: useRight token is nonexists");
        if (_useRightId2TaskIds[tokenId].length > 0) {
            (parameter, result) = SCPNSProofTask.taskDataOfUseRightId(tokenId, _useRightId2TaskIds[tokenId].length - 1);
        }
    }

    function taskDataOfUseRightId(uint256 tokenId, uint256 index) 
        public view virtual override returns(TaskParameter memory parameter, TaskDetail memory result) {

        require(_useRightTokenIf().exists(tokenId), "SCPNSProofTask: useRight token is nonexists");
        require(SCPNSProofTask.taskDataCountOfUseRightId(tokenId) > index, "SCPNSProofTask: index is out bound of result.");

        uint256[] storage taskIds = _useRightId2TaskIds[tokenId];
        if (taskIds.length > index) {
            (parameter, result) = SCPNSProofTask.taskDataOf(taskIds[taskIds.length -1]);
        }
    }

    function taskDataCountOfUseRightId(uint256 tokenId) public view virtual override returns(uint256) {
        require(_useRightTokenIf().exists(tokenId), "SCPNSProofTask: useRight token is nonexists");
        return _useRightId2TaskIds[tokenId].length;
    }

    function taskDataOf(uint256 tokenId) public view virtual override returns(TaskParameter memory parameter, 
                                                                     TaskDetail memory result) {
        require(_exists(tokenId), "SCPNSProofTask: token is nonexists");

        parameter = _id2TaskParameter[tokenId];
        result = _id2TaskDetail[tokenId];
    }

    function merkleRootOf(uint256 tokenId) public view virtual override returns(bytes32) {
        return _id2TaskDetail[tokenId].merkleRoot;
    }

    function __uint2Bytes32(uint256 x) internal pure returns (bytes memory b) {
        b = new bytes(32);
        for (uint i = 0; i < 32; i++) {
            b[i] = bytes1(uint8(x / (2**(8*(31 - i)))));
        }
        
    }
    function __prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Dynamic Data Head:\n32", hash));
    }

    function cretateQ(bytes32 data) public pure returns(bytes32) {
        return keccak256(abi.encodePacked("\x19Question data:\n32", data));
    }

    function __selectParameterId(uint256 useRightId) internal view returns(uint256) {
        uint256 typeUnitId = _useRightTokenIf().typeUnitIdOf(useRightId);
        uint256 typeUnitCount = _useRightTokenIf().typeUnitCountOf(useRightId);
        uint256 parameterId = _proofParameterIf().selectParameterId(typeUnitId, typeUnitCount);
        return parameterId;
    }

    function _purgeMemory(uint256 useRightId, uint256 keepCount) internal {
        if (keepCount != type(uint256).max) {
           uint256 length = _useRightId2TaskIds[useRightId].length;
           if (length > keepCount) {
               uint256 reCount = keepCount - length;
               while(reCount > 0) {
                   uint256 taskId = _useRightId2TaskIds[useRightId][reCount -1];

                   _burn(taskId);
               }
           }
        }
    }

    function _burn(uint256 tokenId) internal virtual override(SCPNSBase) {
        super._burn(tokenId);
        delete _id2TaskParameter[tokenId];
        delete _id2TaskDetail[tokenId];
        delete _id2useRightId[tokenId];
        delete _id2Question[tokenId];
    }

    function _checkA(uint256 tokenId, bytes32 a) internal view {
        if (_id2Question[tokenId] != bytes32(0)) {
            bytes32 q = _id2Question[tokenId];
            bytes32 a2q = SCPNSProofTask.cretateQ(a);
            require(q == a2q, "SCPNSProofTask: wrong answer");
        }
    }
    //must be at end
    uint256[48] private __gap;
}

