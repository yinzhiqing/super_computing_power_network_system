
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./SCPNSBase.sol";
import "./interface/ISCPNSProofTask.sol";
import "./interface/ISCPNSUseRightToken.sol";
import "./interface/ISCPNSProofParameter.sol";

contract SCPNSProofTask is 
SCPNSBase, 
ISCPNSProofTask
{

    using CountersUpgradeable for CountersUpgradeable.Counter;

    address public proofParameterAddr;
    // 
    address public useRightTokenAddr;
    // Per-UseRightToken keep count of task
    uint256 public keepTaskCountOfUseRightId;

    ISCPNSProofParameter internal proofParameterIf;
    ISCPNSUseRightToken  internal useRightTokenIf;
    // The block number where the previous event was located.
    uint256 internal _preBlockNumber;
    // Task index(0~n)
    CountersUpgradeable.Counter _eventIndex;
    // Task Id Generator
    CountersUpgradeable.Counter _idGenerator;
    // Mapping from task id to parameter
    mapping (uint256 => TaskParameter) internal _id2TaskParameter;
    // Mapping from task id to task Detail
    mapping (uint256 => TaskDetail) internal _id2TaskDetail;
    // Mapping from task id to use right id
    mapping (uint256 => uint256) internal _id2useRightId;
    // Mapping from use right id to task id list;
    mapping (uint256 => uint256[]) internal _useRightId2TaskIds;


    function initialize(address useRightToken, address proofParameter) 
    initializer 
    public 
    {
        __SCPNSProofTask_init(useRightToken, proofParameter);

    }
    function __SCPNSProofTask_init(address useRightToken, address proofParameter)
    internal 
    initializer 
    {
        __SCPNSBase_init("SCPNSProofTask", "SCPNSProofTask", "");
        __SCPNSProofTask_init_unchained(useRightToken, proofParameter);
    }

    function __SCPNSProofTask_init_unchained(address useRightToken, address proofParameter) 
    internal initializer 
    {
        _unitType("prooftask");
        useRightTokenAddr = useRightToken;
        useRightTokenIf = ISCPNSUseRightToken(useRightToken);

        proofParameterAddr = proofParameter;
        proofParameterIf = ISCPNSProofParameter(proofParameter);

        keepTaskCountOfUseRightId = type(uint256).max;
    }

    function mint(address to, uint256 useRightId, string memory datas) public virtual override {
        require(_msgSender() == useRightTokenIf.ownerOf(useRightId) 
            || hasRole(MANAGE_ROLE, _msgSender()), 
            "SCPNSProofTask: The sender is onwer of useRightId or sender has MANAGE_ROLE role.");

        uint256 tokenId = _idGenerator.current();
        bytes32 tokenName = bytes32(tokenId);
        _mint(to, tokenId, tokenName, datas);

        TaskParameter storage tp = _id2TaskParameter[tokenId];
        tp.taskType = TaskType.Manual;
        tp.dynamicData = __prefixed(keccak256(abi.encodePacked(block.timestamp, _msgSender(), tokenId, tp.taskType)));
        tp.parameterId = __selectParameterId(useRightId);

        TaskDetail storage td = _id2TaskDetail[tokenId];
        td.tokenId = tokenId;
        td.start = block.timestamp;
        td.state = TaskState.Start;

        _useRightId2TaskIds[useRightId].push(tokenId);

        //purge some data in memory
        _purgeMemory(useRightId, keepTaskCountOfUseRightId);
        emit TaskData(_eventIndex.current(), useRightId, tokenId, _preBlockNumber, _msgSender(), tp, td, datas);

        // next mint use 
        _preBlockNumber = block.number;
        _idGenerator.increment();
        _eventIndex.increment();
    }

    function taskEnd(uint256 tokenId, string memory result) public virtual override {
        uint256 useRightId = _id2useRightId[tokenId];
        require(hasRole(MINTER_ROLE, _msgSender()), "SCPNSProofTask: must have minter role to add");
        require(_msgSender() == useRightTokenIf.ownerOf(_id2useRightId[tokenId]), 
                "SCPNSProofTask: tokenId owner is not sender");
        require(_id2TaskDetail[tokenId].state == TaskState.Start, 
                "SCPNSProofParameter: task state is not Start, can't change.");

        TaskParameter storage tp = _id2TaskParameter[tokenId];
        TaskDetail storage td = _id2TaskDetail[tokenId];
        td.state = TaskState.End;
        td.result = result;

        emit TaskData(_eventIndex.current(), useRightId, tokenId, _preBlockNumber, _msgSender(), tp, td, "");

        // next event use 
        _preBlockNumber = block.number;
        _eventIndex.increment();
    }

    function taskCancel(uint256 tokenId) public virtual override {
        uint256 useRightId = _id2useRightId[tokenId];
        require(hasRole(MINTER_ROLE, _msgSender()), "SCPNSProofTask: must have minter role to add");
        require(_msgSender() == useRightTokenIf.ownerOf(_id2useRightId[tokenId]), 
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

    function updateUseRightToken(address contract_) public virtual override {
        require(hasRole(MANAGE_ROLE, _msgSender()), "SCPNSProofTask: must have manager role to add");
        require(contract_ != address(0), "SCPNSProofTask: contract address is invalid address.");

        useRightTokenAddr = contract_;
        useRightTokenIf = ISCPNSUseRightToken(contract_);
    }

    function updateProofParameter(address contract_) public virtual override {
        require(hasRole(MANAGE_ROLE, _msgSender()), "SCPNSProofTask: must have manager role to add");
        require(contract_ != address(0), "SCPNSProofTask: contract address is invalid address.");

        proofParameterAddr = contract_;
        proofParameterIf = ISCPNSProofParameter(contract_);
    }

     function updateKeepTaskCount(uint256 keepCount) public virtual override {
        require(hasRole(MANAGE_ROLE, _msgSender()), "SCPNSProofTask: must have manager role to add");
        require(keepCount > 0, "SCPNSProofTask: The minimum value of a is 1.");
        keepTaskCountOfUseRightId = keepCount;
     }

    function eventCountOf() public view virtual override returns(uint256) {
        return _eventIndex.current();
    }

    function latestParametersByUseRightId(uint256 tokenId) public view virtual override returns(
        bytes32 dynamicData, bytes32[] memory names, uint256[] memory values, uint256 taskId) {
        uint256[] storage taskIds = _useRightId2TaskIds[tokenId];

        if (taskIds.length > 0) {
            taskId = taskIds[taskIds.length - 1];
            (dynamicData, names, values) = SCPNSProofTask.parametersOf(taskId);
        } 
    }

    function parametersOf(uint256 tokenId) public view virtual override returns(bytes32 dynamicData, 
                                                                       bytes32[] memory names, 
                                                                       uint256[] memory values) {
        TaskParameter storage tp = _id2TaskParameter[tokenId];
        dynamicData = tp.dynamicData;
        (names, values) = proofParameterIf.parametersOf(tp.parameterId);
    }

    function latestTaskDataByUseRightId(uint256 tokenId) public view virtual override returns(TaskParameter memory parameter, 
                                                                                     TaskDetail memory result) {
        if (_useRightId2TaskIds[tokenId].length > 0) {
            (parameter, result) = SCPNSProofTask.taskDataOfUseRightId(tokenId, _useRightId2TaskIds[tokenId].length - 1);
        }
    }

    function taskDataOfUseRightId(uint256 tokenId, uint256 index) public view virtual override returns(TaskParameter memory parameter, 
                                                                                              TaskDetail memory result) {
        require(SCPNSProofTask.taskDataCountOfUseRightId(tokenId) > index, "SCPNSProofTask: index is out bound of result.");

        uint256[] storage taskIds = _useRightId2TaskIds[tokenId];
        if (taskIds.length > index) {
            (parameter, result) = SCPNSProofTask.taskDataOf(taskIds[taskIds.length -1]);
        }
    }

    function taskDataCountOfUseRightId(uint256 tokenId) public view virtual override returns(uint256) {
        return _useRightId2TaskIds[tokenId].length;
    }

    function taskDataOf(uint256 tokenId) public view virtual override returns(TaskParameter memory parameter, 
                                                                     TaskDetail memory result) {
        parameter = _id2TaskParameter[tokenId];
        result = _id2TaskDetail[tokenId];
    }

    function __prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Dynamic Data Head:\n32", hash));
    }

    function __selectParameterId(uint256 useRightId) internal view returns(uint256) {
        uint256 typeUnitId = useRightTokenIf.typeUnitIdOf(useRightId);
        uint256 parameterId = proofParameterIf.tokenIdOfTypeUnitId(typeUnitId);
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
    }

    //must be at end
    uint256[48] private __gap;
}

