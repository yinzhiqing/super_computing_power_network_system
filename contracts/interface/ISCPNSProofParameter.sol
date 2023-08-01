
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface ISCPNSProofParameter{
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
    function updateKeepTaskCount(uint256 keepCount) external;

    function mint(uint256 tokenId, bytes32 name_, uint256 typeUnitId, string memory datas) external;
    function updateTypeUnit(address contract_) external;
    function setValueOfParameter(uint256 tokenId, bytes32 pname, uint256 pvalue) external;
    function valueOfParameter(uint256 tokenId, bytes32 pname) external view returns(uint256);
    function typeUnitIdOf(uint256 tokenId) external view returns(uint256);
    function tokenIdOfTypeUnitId(uint256 typeUnitId) external view returns(uint256);
    function parameterCountOf(uint256 tokenId) external view returns(uint256);
    function parameterNameOf(uint256 tokenId, uint256 index) external view returns(bytes32);
    function parametersOf(uint256 tokenId) external view returns(bytes32[] memory names, uint256[] memory values);
}
