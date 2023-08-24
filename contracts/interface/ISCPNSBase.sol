// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface ISCPNSBase {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId, bytes32 tokenName, string data);

    function update(uint256 tokenId, string memory datas) external;
    function pause() external;
    function unpause() external;

    function unitType() external view returns(string memory);
    function nameOf(uint256 tokenId) external view returns(bytes32);
    function datasOf(uint256 tokenId) external view returns(string memory);
    function tokenIdOf(bytes32 name_) external view returns(uint256);
    function exists(uint256 tokenId) external view returns(bool);
    function addController(address controller) external;
    function removeController(address controller) external;
    function cleanControllers() external;
    function isController(address controller) external view returns(bool);

}
