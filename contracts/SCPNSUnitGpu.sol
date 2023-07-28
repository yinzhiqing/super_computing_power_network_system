
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./SCPNSUnitBase.sol";

contract SCPNSUnitGpu is SCPNSUnitBase {

    function initialize() 
    initializer 
    public 
    {
        __SCPNSUnitGpu_init();

    }
    function __SCPNSUnitGpu_init()
    internal 
    initializer 
    {
        __SCPNSUnitBase_init("SCPNSUnitGpu", "SCPNSUnitGpu", "");
        __SCPNSUnitGpu_init_unchained();
    }

    function __SCPNSUnitGpu_init_unchained() 
    internal initializer 
    {
        _unitType("gpu");
    }


    //must be at end
    uint256[48] private __gap;
}

