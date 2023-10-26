
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./ISCPNSBase.sol";

interface ISCPNSUseRightToken is
    ISCPNSBase
{
    function mint(address to, uint256 tokenId, uint256 deadline,
                  uint256[] memory computilityVMs, string memory datas) external;
    function typeUnitIdOf(uint256 tokenId) external view returns(uint256);
    function typeUnitCountOf(uint256 tokenId) external view returns(uint256);
    function ownerOf(uint256 tokenId) external view returns(address);
    function deadLine(uint256 tokenId) external view returns(uint256);
    function isValid(uint256 tokenId) external view returns(bool);
    function parameterIdOf(uint256 tokenId) external view returns(uint256);
}
