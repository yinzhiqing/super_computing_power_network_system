
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./SCPNSUnitBase.sol";
import "./interface/ISCPNSProofTask.sol";
import "./interface/ISCPNSUseRightToken.sol";
import "./interface/ISCPNSProofParameter.sol";

contract SCPNSProofTask is SCPNSUnitBase {

    using CountersUpgradeable for CountersUpgradeable.Counter;

    enum TaskType {Manual, Auto, Type3, Type4}
    struct TaskParameter {
        uint256  parameterId;
        bytes32  dynamicData;
        TaskType taskType;
    }

    enum TaskState {Start, Working, End, Cancel, ERROR}
    struct TaskDetail {
        uint256 start;
        uint256 end;
        TaskState state;
        string result;
    }

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
    mapping (uint256 => TaskParameter) internal _id2Parameter;
    // Mapping from task id to task Detail
    mapping (uint256 => TaskDetail) internal _id2TaskDetail;
    // Mapping from task id to use right id
    mapping (uint256 => uint256) internal _id2useRightId;
    // Mapping from use right id to task id list;
    mapping (uint256 => uint256[]) internal _useRightId2TaskIds;

    event TaskData(uint256 indexed index, 
                   uint256 indexed useRightId, 
                   uint256 indexed taskId, 
                   uint256 preBlockNumber,  
                   address sender, 
                   TaskParameter taskParameter, 
                   TaskDetail taskDetail, 
                   string datas);

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
        __SCPNSUnitBase_init("SCPNSProofTask", "SCPNSProofTask", "");
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

    function mint(uint256 useRightId, string memory datas) public virtual {
        require(_msgSender() == useRightTokenIf.ownerOf(useRightId) 
            || hasRole(MANAGE_ROLE, _msgSender()), 
            "SCPNSProofTask: The sender is onwer of useRightId or sender has MANAGE_ROLE role.");

        uint256 tokenId = _idGenerator.current();
        bytes32 tokenName = bytes32(tokenId);
        _mint(tokenId, tokenName, datas);

        TaskParameter storage tp = _id2Parameter[tokenId];
        tp.taskType = TaskType.Manual;
        tp.dynamicData = __prefixed(keccak256(abi.encodePacked(block.timestamp, _msgSender(), tokenId, tp.taskType)));
        tp.parameterId = __selectParameterId(useRightId);

        TaskDetail storage td = _id2TaskDetail[tokenId];
        td.start = block.timestamp;
        td.state = TaskState.Start;

        _useRightId2TaskIds[useRightId].push(tokenId);

        //keep some data in memory
        _cleanMemory(useRightId, keepTaskCountOfUseRightId);
        emit TaskData(_eventIndex.current(), useRightId, tokenId, _preBlockNumber, _msgSender(), tp, td, datas);

        // next mint use 
        _preBlockNumber = block.number;
        _idGenerator.increment();
        _eventIndex.increment();
    }

    function taskEnd(uint256 tokenId, string memory result) public virtual {
        uint256 useRightId = _id2useRightId[tokenId];
        require(hasRole(MINTER_ROLE, _msgSender()), "SCPNSProofTask: must have minter role to add");
        /*
           task owner to end
        */
        require(_msgSender() == useRightTokenIf.ownerOf(_id2useRightId[tokenId]), 
                "SCPNSProofTask: tokenId owner is not sender");

        TaskParameter storage tp = _id2Parameter[tokenId];
        TaskDetail storage td = _id2TaskDetail[tokenId];
        td.state = TaskState.End;
        td.result = result;

        emit TaskData(_eventIndex.current(), useRightId, tokenId, _preBlockNumber, _msgSender(), tp, td, "");

        // next event use 
        _preBlockNumber = block.number;
        _eventIndex.increment();
    }

    function taskCancel(uint256 tokenId) public virtual {
        uint256 useRightId = _id2useRightId[tokenId];
        require(hasRole(MINTER_ROLE, _msgSender()), "SCPNSProofTask: must have minter role to add");
        require(_msgSender() == useRightTokenIf.ownerOf(_id2useRightId[tokenId]), 
                "SCPNSProofTask: tokenId owner is not sender");

        TaskParameter storage tp = _id2Parameter[tokenId];
        TaskDetail storage td = _id2TaskDetail[tokenId];
        td.state = TaskState.Cancel;

        emit TaskData(_eventIndex.current(), useRightId, tokenId, _preBlockNumber, _msgSender(), tp, td, "");

        // next event use 
        _preBlockNumber = block.number;
        _eventIndex.increment();
    }

    function updateUseRightToken(address contract_) public virtual {
        require(hasRole(MANAGE_ROLE, _msgSender()), "SCPNSProofTask: must have manager role to add");
        require(contract_ != address(0), "SCPNSProofTask: contract address is invalid address.");

        useRightTokenAddr = contract_;
        useRightTokenIf = ISCPNSUseRightToken(contract_);
    }

    function updateProofParameter(address contract_) public virtual {
        require(hasRole(MANAGE_ROLE, _msgSender()), "SCPNSProofTask: must have manager role to add");
        require(contract_ != address(0), "SCPNSProofTask: contract address is invalid address.");

        proofParameterAddr = contract_;
        proofParameterIf = ISCPNSProofParameter(contract_);
    }

     function updateKeepTaskCount(uint256 keepCount) public virtual {
        require(hasRole(MANAGE_ROLE, _msgSender()), "SCPNSProofTask: must have manager role to add");
        require(keepCount > 0, "SCPNSProofTask: The minimum value of a is 1.");
        keepTaskCountOfUseRightId = keepCount;
     }

    function __prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Dynamic Data Head:\n32", hash));
    }

    function __selectParameterId(uint256 useRightId) internal view returns(uint256) {
        uint256 typeUnitId = useRightTokenIf.typeUnitIdOf(useRightId);
        uint256 parameterId = proofParameterIf.tokenIdOfTypeUnitId(typeUnitId);
        return parameterId;
    }

    function _cleanMemory(uint256 useRightId, uint256 keepCount) internal {
        if (keepCount != type(uint256).max) {
           uint256 length = _useRightId2TaskIds[useRightId].length;
           if (length > keepCount) {
               uint256 reCount = keepCount - length;
               while(reCount > 0) {
                   uint256 taskId = _useRightId2TaskIds[useRightId][reCount -1];

                   delete _id2Parameter[taskId];
                   delete _id2TaskDetail[taskId];
                   delete _id2useRightId[taskId];
               }
           }
        }
    }

    //must be at end
    uint256[48] private __gap;
}

