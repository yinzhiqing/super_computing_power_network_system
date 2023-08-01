// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface ISCPNSProofTask{
    function name() external view returns(string memory);
    function symbol() external view returns(string memory);
    function unitType() external view returns(string memory);
    function datasOf(uint256 tokenId) external view returns(string memory);
    function nameOf(uint256 tokenId) external view returns(string memory);
    function tokenIdOf(bytes32 name_) external view returns(uint256);
    function exists(uint256 tokenId) external view returns(bool);
    function mint(uint256 useRightId, string memory datas) external ;
    function taskEnd(uint256 tokenId, string memory result) external;
    function taskCancel(uint256 tokenId) external;
    function updateUseRightToken(address contract_) external;
    function updateProofParameter(address contract_) external;
    function updateKeepTaskCount(uint256 keepCount) external;
}
