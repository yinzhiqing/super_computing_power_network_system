
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSGpuList is 
    ISCPNSBase
{
    function mint(address to, uint256 tokenId, bytes32 name_, string memory datas) external;
}
