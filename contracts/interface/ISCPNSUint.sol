// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface ISCPNSUint {
    function name() external view returns(string memory);
    function symbol() external view returns(string memory);
    function unitType() external view returns(string memory);
    function datasOf(uint256 tokenId) external view returns(string memory);
    function nameOf(uint256 tokenId) external view returns(string memory);
    function tokenIdOf(bytes32 name_) external view returns(uint256);
}
