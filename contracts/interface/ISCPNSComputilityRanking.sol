// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface ISCPNSComputilityRanking 
{
    event Set(uint256 indexed index,  uint256 indexed useRightId, uint256 preBlockNumber, uint256 selfPreBlockNumber, uint256 execTime, uint256 parameterId, uint256 taskId);

    function set(uint256 useRightId, uint256 start, uint256 end, uint256 parameterId, uint256 taskId) external;

    function isController(address controller) external view returns(bool);
    function exctimeOf(uint256 useRightId) external view returns(uint256);
    function parameterIdOf(uint256 useRightId) external view returns(uint256);
    function taskIdOf(uint256 useRightId) external view returns(uint256);
    function lastBlockNumberOf(uint256 useRightId) external view returns(uint256);
    function lastBlockNumber() external view returns(uint256);
    function excTimeDistTableOf(uint256 scale) external view returns(uint256[] memory keys, uint256[] memory values);
}
