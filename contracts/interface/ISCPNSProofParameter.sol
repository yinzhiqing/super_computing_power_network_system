
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSProofParameter is 
    ISCPNSBase
{
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
