
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSComputilityVM is 
    ISCPNSBase
{
    function mint(address to, uint256 tokenId, uint256 deadline, 
                  uint256[] memory computilityUnits, uint256[] memory counts, string memory datas) external;
    function changeUser(address to, uint256 tokenId) external;
}
