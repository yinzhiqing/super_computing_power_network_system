
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSProofParameter is 
    ISCPNSBase
{
    function mint(uint256 tokenId, bytes32 name_, string memory parameter, string memory datas) external;
    function setDefaultToken(uint256 tokenId) external;

    function parameterOf(uint256 tokenId) external view returns(string memory);
    function defaultToken() external view returns(uint256);
    function selectParameterId(uint256 typeUnitId, uint256 typeUnitCount) external view returns(uint256);
}
