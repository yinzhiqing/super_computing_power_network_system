

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSComputilityUnit is 
    ISCPNSBase
{
    function mint(address to, uint256 tokenId, uint256 count_, uint256 typeUnitId, uint256 typeUnitCount_, string memory datas) external;
    function burn(uint256 tokenId) external override;
    function updateTypeUnit(address contract_) external;

    function balanceOf(address owner) external view returns (uint256);
    function typeUnitIdOf(uint256 tokenId) external view returns(uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function countOfTypeUnit(uint256 tokenId) external view returns(uint256);
    function countOf(uint256 tokenId) external view returns(uint256);
}
