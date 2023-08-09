// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface ISCPNSBase {
    event UpdateDatas(uint256 indexed tokenId, bytes32 tokenName, address sender, string data);

    function mint(uint256 tokenId, bytes32 name_, string memory datas) external;
    function update(uint256 tokenId, string memory datas) external;
    function burn(uint256 tokenId) external; 
    function unpause() external;
    function pause() external;

    function name() external view returns(string memory);
    function symbol() external view returns(string memory);
    function unitType() external view returns(string memory);
    function nameOf(uint256 tokenId) external view returns(bytes32);
    function datasOf(uint256 tokenId) external view returns(string memory);
    function tokenIdOf(bytes32 name_) external view returns(uint256);
    function exists(uint256 tokenId) external view returns(bool);
    function tokenOfByIndex(uint256 index) external view returns(uint256);
    function countOf() external view returns(uint256 count);
    function baseURI() external view returns(string memory);
}
