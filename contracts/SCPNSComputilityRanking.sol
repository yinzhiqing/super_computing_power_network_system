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

    // tokenId is useRightId
    // Mapping (tokenId => (parameterId => taskId))
    mapping (uint256 => PairValues.PairUint256) private _id2PidTid;
    // Mapping (tokenId => parameterId)
    mapping (uint256 => uint256) private _id2ParameterIds;
    // Mapping (parameterId => (tokenId => Times))
    mapping (uint256 => PairValues.PairUint256) private _id2Times;
    // Mapping (parameterId => (tokenId => preBlockNumber))
    mapping (uint256 => PairValues.PairUint256) private _id2PreBlockNumber;
    // Mapping (parameterId => (tokenId => excTime))
    mapping (uint256 => PairValues.PairUint256) private _id2ExcTime;
    // Mapping (parameterId => scales))
    mapping (uint256 => ArrayUnit256.Uint256s) private _scales ;
    // Mapping (parameterId => (scale => (excTimeOfScale => count)))
    mapping (uint256 => mapping(uint256 => PairValues.PairUint256)) private _excTimeDistTables;

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
        _updateExcTimeDistTables(parameterId, tokenId, __execTime);

        _id2ParameterIds[parameterId] = taskId;
        _id2ParameterIds[tokenId] = parameterId;
        _id2ExcTime[parameterId].set(tokenId, __execTime);
        
        emit Set(_eventIndex.current() - 1, parameterId, tokenId, _preBlockNumber, _id2PreBlockNumber[parameterId].valueOf(tokenId), __execTime, taskId);

        _preBlockNumber = block.number;
        _id2PreBlockNumber[parameterId].set(tokenId, block.number);
        _eventIndex.increment();

    }
    
    function excTimeDistTableOf(uint256 parameterId, uint256 scale) public view virtual override returns(uint256[] memory keys, uint256[] memory values) {
        require(scale > 0, "SCPNSComputilityRanking: the scale value must be greater than 0");

        PairValues.PairUint256 storage _excTimeDistTable = _excTimeDistTables[parameterId][scale];
        keys = _excTimeDistTable.keysOf();
        values = _excTimeDistTable.valuesOf();

        uint256 __swap = 0;
        for(uint256 i = 0; i < keys.length; i++) {
            // select min key index
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

                __swap = values[i];
                values[i] = values[__minKeyIndex];
                values[__minKeyIndex] = __swap;
            }
        }
    }

    function exctimeOf(uint256 parameterId, uint256 tokenId) public view virtual override returns(uint256) {
        return _id2ExcTime[parameterId].valueOf(tokenId);
    }

    function parameterIdsOf(uint256 tokenId) public view virtual override returns(uint256[] memory) {
        return _id2PidTid[tokenId].keysOf();
    }
    function lastTaskIdOf(uint256 tokenId) public view virtual override returns(uint256) {
        return _id2PidTid[tokenId].valueOf(_id2ParameterIds[tokenId]);
    }

    function lastBlockNumberOf(uint256 parameterId, uint256 tokenId) public view virtual override returns(uint256) {
        return _id2PreBlockNumber[parameterId].valueOf(tokenId);
    }
    
    function lastBlockNumber() public view virtual override returns(uint256) {
        return _preBlockNumber;
    }

    function _updateExcTimeDistTables(uint256 parameterId, uint256 tokenId, uint256 _execTime) private {
        // decrement old time dist table of tokenId
        if (_id2Times[parameterId].exists(tokenId) && _id2Times[parameterId].valueOf(tokenId) > 0) {
            uint256 __preExecTime = _id2ExcTime[parameterId].valueOf(tokenId);

            for(uint256 i = 0; i < _scales[parameterId].length(); i++) {
                uint256 __scale = _scales[parameterId].valueOf(i);
                uint256 __scalePreExecTime = __preExecTime / __scale;
                _excTimeDistTables[parameterId][__scale].decrement(__scalePreExecTime, 1);
                _excTimeDistTables[parameterId][__scale].removeMatched(__scalePreExecTime, 0);
            }
        }

        // increment times of scales
        for(uint256 i = 0; i < _scales[parameterId].length(); i++) {
            uint256 __scale = _scales[parameterId].valueOf(i);
            _excTimeDistTables[parameterId][__scale].increment(_execTime / __scale, 1);
        }

        _id2Times[parameterId].increment(tokenId, 1);
    }
}
