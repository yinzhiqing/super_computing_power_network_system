
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSProofParameter is 
    ISCPNSBase
{
    function mint(uint256 tokenId, bytes32 name_, string memory parameter, string memory datas) external;
    function setDefaultTokenOf(uint256 typeUnitId, uint256 tokenId) external;
    function setComputilityRange(uint256 tokenId, uint256 typeUnitId, uint256 min, uint256 max) external;

    function parameterOf(uint256 tokenId) external view returns(string memory);
    function parameterIdOfTypeUnitId(uint256 typeUnitId) external view returns(uint256);
    function computilityRangeOfTypeUnit(uint256 tokenId, uint256 typeUnitId) external view returns(uint256 min, uint256 max);
    function typeUnitIds() external view returns(uint256[] memory);
}
