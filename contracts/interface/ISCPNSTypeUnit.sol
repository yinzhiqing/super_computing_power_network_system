
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSTypeUnit is
    ISCPNSBase
{
    function mint(uint256 tokenId, bytes32 name_, address unitAddr, uint256 unitId, string memory datas) external;
    function unitTypeOf(uint256 tokenId) external view returns(string memory);
    function unitDatasOf(uint256 tokenId) external view returns(string memory);
    function unitIdOf(uint256 tokenId) external view returns(uint256);
}
