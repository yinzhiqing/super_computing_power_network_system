// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

contract AssemblyDNS is 
    Initializable, 
    AccessControlEnumerableUpgradeable, 
    PausableUpgradeable
{
    //variable members
    string private _name;
    string private _symbol;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Mapping  from interface to state
    mapping (string => uint256)     private _hosts;
    mapping (string => bool)        private _exists;
    mapping (uint256 => address)    private _addresses;
    mapping (uint256 => string)     private _names;
    uint256 private _count;

    event Set(string indexed name, address addr, address manager);
    event Del(string indexed name, address addr, address manager);

    function initialize(string memory name_, string memory symbol_) 
    initializer 
    public 
    {
        __AssemblyDNS_init(name_, symbol_);

    }
    function __AssemblyDNS_init(string memory name_, string memory symbol_)
    internal 
    initializer 
    {
        __Pausable_init_unchained();
        __AccessControlEnumerable_init_unchained();
        __AssemblyDNS_init_unchained(name_, symbol_);
    }

    function __AssemblyDNS_init_unchained(string memory name_, string memory symbol_) 
    internal initializer 
    {
        _name   = name_;
        _symbol = symbol_;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MANAGER_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        //other init
    }

    function name() public view virtual returns(string memory) 
    {
        return _name;
    }

    function symbol() public view virtual returns(string memory) 
    {
        return _symbol;
    }
    /**
     * @dev Pauses all token transfers.
     *
     * See {Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "AssemblyDNS: must have pauser role to pause");
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "AssemblyDNS: must have pauser role to unpause");
        _unpause();
    }

    function set(string memory name_, address addr_) public whenNotPaused virtual {
        require(hasRole(MANAGER_ROLE, _msgSender()), "AssemblyDNS: must have pauser role to set");
        if (_exists[name_]) {
            _addresses[_hosts[name_]] = addr_;
        } else {
            _hosts[name_] = _count;
            _addresses[_count] = addr_;
            _names[_count] = name_;
            _exists[name_] = true;
            _count = _count + 1;
        }
        emit Set(name_, addr_, _msgSender());
    }

    function addressOf(string memory name_) public view virtual returns(address) {
        if (_exists[name_]) {
            return _addresses[_hosts[name_]];
        }
        return address(0);
    }

    function exists(string memory name_) public view virtual returns(bool) {
        return _exists[name_];
    }

    function count() public view virtual returns(uint256) {
        return _count;
    }

    function hostOf(uint256 index) public view virtual returns(string memory, address) {
        if (index < _count) {
            return (_names[index], _addresses[index]);
        }

        return ("", address(0));
    }

    //must be at end
    uint256[48] private __gap;
}
