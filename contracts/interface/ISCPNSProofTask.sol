// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSProofTask is 
    ISCPNSBase 
{
    enum TaskType {None, Manual, Auto, Type3, Type4}
    struct TaskParameter {
        uint256  parameterId;
        bytes32  dynamicData;
        TaskType taskType;
    }

    enum TaskState {None, Start, End, Cancel, ERROR}
    struct TaskDetail {
        uint256 tokenId;
        uint256 start;
        uint256 end;
        bytes32 merkleRoot;
        TaskState state;
        bool    useSha256;
    }

    event TaskData(uint256 indexed index, uint256 indexed useRightId, uint256 indexed taskId, 
                   uint256 preBlockNumber,  address sender, TaskParameter taskParameter, TaskDetail taskDetail, string datas);

    function mint(address to, uint256 useRightId, bytes32 q, string memory datas) external ;
    function taskEnd(uint256 tokenId, bytes32 merkleRoot, bytes32 a, bool useSha256) external;
    function taskCancel(uint256 tokenId) external;
    function updateKeepTaskCount(uint256 keepCount) external;

    function eventCountOf() external view returns(uint256);
    function latestParametersByUseRightId(uint256 tokenId) external view returns(
        bytes32 dynamicData, string memory parameter, uint256 taskId, bool has);
    function parameterOf(uint256 tokenId) external view returns(
        bytes32 dynamicData, string memory parameter);
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
