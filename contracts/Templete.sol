// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

contract Templete is OwnableUpgradeable{

    //variable members
    string private _name;
    string private _symbol;

    function initialize() 
    initializer 
    public 
    {
        __Templete_init();

    }
    function __Templete_init()
    internal 
    initializer 
    {
        __Ownable_init();
        __Templete_init_unchained();
    }

    function __Templete_init_unchained() 
    internal initializer 
    {
        _name   = "Templete contract";
        _symbol = "Templete";

        //other init
    }


    //must be at end
    uint256[48] private __gap;
}
