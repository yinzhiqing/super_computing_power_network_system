
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./SCPNSUnitBase.sol";

contract SCPNSProofTask is SCPNSUnitBase {

    using CountersUpgradeable for CountersUpgradeable.Counter;

    enum TaskType {Manual, Auto, Type3, Type4}
    struct TaskParameter {
        TaskType taskType;
        bytes32  dynamicData;
        uint256  parameterId;
    }

    enum TaskState {Start, Working, End, Error}
    struct TaskDetail {
        TaskState taskId;
        uint256 state;
        uint256 start;
        uint256 end;
    }

    address public proofParameterAddr;
    // 
    address public useRightTokenAddr;
    // Per-UseRightToken keep count of task
    uint256 public keepTaskCountOfUseRightId;
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
    // Mapping from use right id to task count
    mapping (uint256 => CountersUpgradeable.Counter) _useRightId2TaskCount;

    event UpdateTask(uint256 indexed index, uint256 indexed useRightId, uint256 indexed taskId,  uint256 preTaskId, address sender, TaskParameter taskParameter, TaskDetail taskDetail);

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
        proofParameterAddr = proofParameter;
    }

    function mint(uint256 useRightId, string memory datas) public virtual {

        uint256 tokenId = _idGenerator.current();
        bytes32 tokenName = bytes32(tokenId);
        _mint(tokenId, tokenName, datas);

        TaskParameter storage tp = _id2Parameter[tokenId];
        tp.taskType = TaskType.Manual;
        tp.dynamicData = prefixed(keccak256(abi.encodePacked(block.timestamp, _msgSender(), tokenId, tp.taskType)));
        tp.parameterId = _selectParameterId(useRightId);

        emit UpdateDatas(tokenId, tokenName, _msgSender(), datas);
        _idGenerator.increment();
    }

    function _selectParameterId(uint256 useRightId) internal returns(uint256) {


    }

    function updateUseRightTokenAddr(address contract_) public virtual {
        require(hasRole(MANAGE_ROLE, _msgSender()), "SCPNSProofParameter: must have manager role to add");
        require(contract_ != address(0), "SCPNSProofParameter: contract address is invalid address.");

        useRightTokenAddr = contract_;
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Dynamic Data Head:\n32", hash));
    }
    //must be at end
    uint256[48] private __gap;
}

