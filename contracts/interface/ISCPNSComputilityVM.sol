
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSComputilityVM is 
    ISCPNSBase
{
    function mint(address to, uint256 tokenId, uint256 deadline, 
                  uint256[] memory computilityUnits, uint256[] memory counts, string memory datas) external;
    function changeUser(address to, uint256 tokenId) external;
    function typeUnitIdOf(uint256 tokenId) external view returns(uint256);
    function typeUnitCountOf(uint256 tokenId) external view returns(uint256);
    function lockResources(uint256 tokenId, uint256 lockLine) external;
    function deadLine(uint256 tokenId) external view returns(uint256);
    function computilityUnitCountOf(uint256 tokenId) external view returns(uint256);
    function computilityUnitIdByIndex(uint256 tokenId, uint256 index) external view returns(uint256);
    function isFree(uint256 tokenId) external view returns(bool);
}
