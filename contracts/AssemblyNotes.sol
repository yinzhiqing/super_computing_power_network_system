// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

contract AssemblyNotes is 
    Initializable, 
    AccessControlEnumerableUpgradeable, 
    PausableUpgradeable
{

    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant WRITER_ROLE = keccak256("WRITER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    //variable members
    string private _name;
    string private _symbol;

    CountersUpgradeable.Counter private _index;
    uint256 private _lastBlockNumber;

    mapping(address => uint256 ) private _preBlockNumber; 
    mapping(address => CountersUpgradeable.Counter) private _senderIndex;

    event Write(address indexed sender, uint256 indexed index, uint256 indexed senderIndex, uint256 preBlockNumber, uint256 timestamp, string data);

    function initialize(string memory name_, string memory symbol_) 
    initializer 
    public 
    {
        __AssemblyNotes_init(name_, symbol_);

    }
    function __AssemblyNotes_init(string memory name_, string memory symbol_)
    internal 
    initializer 
    {
        __Pausable_init_unchained();
        __AccessControlEnumerable_init_unchained();
        __AssemblyNotes_init_unchained(name_, symbol_);
    }

    function __AssemblyNotes_init_unchained(string memory name_, string memory symbol_) 
    internal initializer 
    {
        _name   = name_;
        _symbol = symbol_;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(WRITER_ROLE, _msgSender());
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
        require(hasRole(PAUSER_ROLE, _msgSender()), "AssemblyNotes: must have pauser role to pause");
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
        require(hasRole(PAUSER_ROLE, _msgSender()), "AssemblyNotes: must have pauser role to unpause");
        _unpause();
    }

    function write(string memory data) public whenNotPaused virtual {
        //require(hasRole(WRITER_ROLE, _msgSender()), "AssemblyDNS: must have pauser role to set");
        emit Write(_msgSender(), _index.current(), _senderIndex[_msgSender()].current(), _preBlockNumber[_msgSender()], block.timestamp ,data);

        _index.increment();
        _senderIndex[_msgSender()].increment();
        _preBlockNumber[_msgSender()] = block.number;
        _lastBlockNumber = block.number; 
    }

    function preBlockNumberOf(address writer) public view virtual returns(uint256) {
        return _preBlockNumber[writer];
    }

    function countOf(address writer) public view virtual returns(uint256) {
        return _senderIndex[writer].current();
    }

    function count() public view virtual returns(uint256) {
        return _index.current();
    }

    function lastBlockNumber() public view virtual returns(uint256) {
        return _lastBlockNumber;
    }
    //must be at end
    uint256[48] private __gap;
}
