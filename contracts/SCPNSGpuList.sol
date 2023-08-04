
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./SCPNSBase.sol";

contract SCPNSGpuList is SCPNSBase {

    function initialize() 
    initializer 
    public 
    {
        __SCPNSGpuList_init();

    }
    function __SCPNSGpuList_init()
    internal 
    initializer 
    {
        __SCPNSBase_init("SCPNSGpuList", "SCPNSGpuList", "");
        __SCPNSGpuList_init_unchained();
    }

    function __SCPNSGpuList_init_unchained() 
    internal initializer 
    {
        _unitType("gpu");
    }


    //must be at end
    uint256[48] private __gap;
}

