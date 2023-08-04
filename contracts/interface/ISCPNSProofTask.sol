// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface ISCPNSProofTask{
    enum TaskType {Manual, Auto, Type3, Type4}
    struct TaskParameter {
        uint256  parameterId;
        bytes32  dynamicData;
        TaskType taskType;
    }

    enum TaskState {Start, End, Cancel, ERROR}
    struct TaskDetail {
        uint256 tokenId;
        uint256 start;
        uint256 end;
        TaskState state;
        string result;
    }

    event TaskData(uint256 indexed index, uint256 indexed useRightId, uint256 indexed taskId, 
                   uint256 preBlockNumber,  address sender, TaskParameter taskParameter, TaskDetail taskDetail, string datas);

    function mint(uint256 useRightId, string memory datas) external ;
    function taskEnd(uint256 tokenId, string memory result) external;
    function taskCancel(uint256 tokenId) external;
    function updateUseRightToken(address contract_) external;
    function updateProofParameter(address contract_) external;
    function updateKeepTaskCount(uint256 keepCount) external;

    function eventCountOf() external view returns(uint256);
    function latestParametersByUseRightId(uint256 tokenId) external view returns(
        bytes32 dynamicData, bytes32[] memory names, uint256[] memory values, uint256 taskId);

    function parametersOf(uint256 tokenId) external view returns(
        bytes32 dynamicData, bytes32[] memory names, uint256[] memory values);

    function latestTaskDataByUseRightId(uint256 tokenId) external view returns(
        TaskParameter memory parameter, TaskDetail memory result);

    function taskDataOfUseRightId(uint256 tokenId, uint256 index) external view returns(
        TaskParameter memory parameter, TaskDetail memory result);
        
    function taskDataCountOfUseRightId(uint256 tokenId) external view returns(uint256);
    function taskDataOf(uint256 tokenId) external view returns(
        TaskParameter memory parameter, TaskDetail memory result);
}