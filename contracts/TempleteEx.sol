// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

contract TempleteEx is OwnableUpgradeable{

    //variable members
    string private _name;
    string private _symbol;

    function initialize() 
    initializer 
    public 
    {
        __TempleteEx_init();

    }
    function __TempleteEx_init()
    internal 
    initializer 
    {
        __Ownable_init();
        __TempleteEx_init_unchained();
    }

    function __TempleteEx_init_unchained() 
    internal initializer 
    {
        _name   = "TempleteEx contract";
        _symbol = "TempleteEx";

        //other init
    }


    //must be at end
    uint256[48] private __gap;
}

