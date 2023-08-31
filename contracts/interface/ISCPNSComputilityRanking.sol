// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface ISCPNSComputilityRanking 
{
    event Set(uint256 indexed index, uint256 indexed parameterId,  uint256 indexed tokenId, uint256 preBlockNumber, uint256 fixPreBlockNumber, uint256 execTime, uint256 taskId);

    function set(uint256 tokenId, uint256 start, uint256 end, uint256 parameterId, uint256 taskId) external;
    function isController(address controller) external view returns(bool);
    function postionOf(uint256 parameterId, uint256 tokenId, uint256 scale) external view returns(uint256);
    function lastTaskIdOf(uint256 tokenId) external view returns(uint256);
    function parameterIdsOf(uint256 tokenId) external view returns(uint256[] memory);
    function scalesOf(uint256 parameterId) external view returns(uint256[] memory);
    function lastBlockNumberOf(uint256 parameterId, uint256 tokenId) external view returns(uint256);
    function lastBlockNumber() external view returns(uint256);
    function excTimeDistTableOf(uint256 parameterId, uint256 scale) external view returns(uint256[] memory keys, uint256[] memory values);
    function lastEventIndex() external view returns(uint256);
}
