// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./interface/ISCPNSProofTask.sol";
import "./interface/ISCPNSUseRightToken.sol";
import "./interface/ISCPNSProofParameter.sol";
import "./interface/ISCPNSComputilityRanking.sol";
import "./PairValues.sol";
import "./ArraryUint256.sol";

contract SCPNSComputilityRanking is 
   Initializable,
   AccessControlEnumerableUpgradeable,
   PausableUpgradeable,
   ISCPNSComputilityRanking
{

    using CountersUpgradeable for CountersUpgradeable.Counter;
    using PairValues for PairValues.PairUint256;
    using ArrayUnit256 for ArrayUnit256.Uint256s;

    //variable members
    string private _name;
    string private _symbol;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    address public proofTaskAddr;
    CountersUpgradeable.Counter _eventIndex;

    mapping (uint256 => uint256) private _id2ParameterIds;
    mapping (uint256 => uint256) private _id2TaskIds;
    mapping (uint256 => uint256) private _id2Times;
    mapping (uint256 => uint256) private _id2PreBlockNumber;
    PairValues.PairUint256 private _id2ExcTime;
    ArrayUnit256.Uint256s private _scales;
    mapping(uint256 => PairValues.PairUint256) private _excTimeDistTables;

    uint256 private _preBlockNumber;

    function initialize(string memory name_, string memory symbol_) 
    initializer 
    public 
    {
        __SCPNSComputilityRanking_init(name_, symbol_);

    }
    function __SCPNSComputilityRanking_init(string memory name_, string memory symbol_)
    internal 
    initializer 
    {
        __Pausable_init_unchained();
        __AccessControlEnumerable_init_unchained();
        __SCPNSComputilityRanking_init_unchained(name_, symbol_);
    }

    function __SCPNSComputilityRanking_init_unchained(string memory name_, string memory symbol_) 
    internal initializer 
    {
        _name   = name_;
        _symbol = symbol_;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MANAGER_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        //other init
        _scales.add(1);
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
        require(hasRole(PAUSER_ROLE, _msgSender()), "SCPNSComputilityRanking: must have pauser role to pause");
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
        require(hasRole(PAUSER_ROLE, _msgSender()), "SCPNSComputilityRanking: must have pauser role to unpause");
        _unpause();
    }

    function isController(address controller) public view virtual override returns(bool) {
        return hasRole(CONTROLLER_ROLE, controller);
    }

    function set(uint256 tokenId, uint256 start, uint256 end, uint256 parameterId, uint256 taskId) public whenNotPaused virtual override {
        require(hasRole(CONTROLLER_ROLE, _msgSender()), "SCPNSComputilityRanking: must have controller role to mint");
        require(end > start, "SCPNSComputilityRanking: start and end value is abnormal");

        uint256 __execTime  = (end - start);
        PairValues.PairUint256 storage _excTimeDistTable = _excTimeDistTables[1];
        // decrement old time dist table of tokenId
        if (_id2Times[tokenId] > 0) {
            uint256 __preExecTime = _id2ExcTime.valueOf(tokenId);
            _excTimeDistTable.decrement(__preExecTime, 1);

            _excTimeDistTable.removeMatched(__preExecTime, 0);
        }

        _excTimeDistTable.increment(__execTime, 1);
        _id2ParameterIds[tokenId] = parameterId;
        _id2TaskIds[tokenId] = taskId;
        _id2ExcTime.set(tokenId, __execTime);
        _id2Times[tokenId] += 1;
        
        emit Set(_eventIndex.current() - 1, tokenId, _preBlockNumber, _id2PreBlockNumber[tokenId], __execTime, parameterId, taskId);

        _preBlockNumber = block.number;
        _id2PreBlockNumber[tokenId] = block.number;
        _eventIndex.increment();

    }
    
    function excTimeDistTableOf(uint256 scale) public view virtual override returns(uint256[] memory keys, uint256[] memory values) {
        require(scale > 0, "SCPNSComputilityRanking: the scale value must be greater than 0");

        PairValues.PairUint256 storage _excTimeDistTable = _excTimeDistTables[scale];
        keys = _excTimeDistTable.keysOf();
        values = _excTimeDistTable.valuesOf();


        /*
        for(uint256 i  = 0; i < _excTimeDistTable.length(); i++) {
            uint256 __index = _excTimeDistTable.keyOfByIndex(i) / scale;
            if (__k2v[__index] == 0) {
                keys.push(__index);
            }
            __k2v[__index] += _excTimeDistTable.valueOfByIndex(i);
        }
        */
        uint256 __swap = 0;
        for(uint256 i = 0; i < keys.length; i++) {
            // select mix item
            uint256 __minKeyIndex = i;
            uint256 __minKey = keys[__minKeyIndex];
            for(uint256 j = i + 1; j < keys.length; j++) {
                if (__minKey > keys[j]) {
                    __minKey = keys[j];
                    __minKeyIndex = j;
                }
            }

            // swap minValue to order end
            if (__minKeyIndex != i) {
                __swap = keys[i];
                keys[i] = __minKey;
                keys[__minKeyIndex] = __swap;
            }
        }
    }

    function exctimeOf(uint256 tokenId) public view virtual override returns(uint256) {
        return _id2ExcTime.valueOf(tokenId);
    }

    function parameterIdOf(uint256 tokenId) public view virtual override returns(uint256) {
        return _id2ParameterIds[tokenId];
    }
    function taskIdOf(uint256 tokenId) public view virtual override returns(uint256) {
        return _id2TaskIds[tokenId];
    }

    function lastBlockNumberOf(uint256 tokenId) public view virtual override returns(uint256) {
        return _id2PreBlockNumber[tokenId];
    }
    
    function lastBlockNumber() public view virtual override returns(uint256) {
        return _preBlockNumber;
    }
}
