
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./ISCPNSBase.sol";

interface ISCPNSUseRightToken is
    ISCPNSBase
{
    function ownerOf(uint256 tokenId) external view returns(address owner);
    function typeUnitIdOf(uint256 tokenId) external view returns(uint256);
}
