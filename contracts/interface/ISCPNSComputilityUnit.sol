// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSComputilityUnit is 
    ISCPNSBase
{
    function mint(address to, uint256 tokenId, uint256 typeUnitId, uint256 typeUnitCount_, string memory datas) external;
    function lockResources(uint256 tokenId, uint256 typeUnitCount) external;
    function unlockResources(uint256 tokenId, uint256 typeUnitCount) external;

    function countOfTypeUnit(uint256 tokenId) external view returns(uint256);
    function typeUnitIdOf(uint256 tokenId) external view returns(uint256);
    function typeUnitCountOf(uint256 tokenId) external view returns(uint256);
    function leaveCountOf(uint256 tokenId) external view returns(uint256);
    //function ownerOf(uint256 tokenId) external view returns(address);
}
