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

contract SCPNSComputilityRanking is 
   Initializable,
   AccessControlEnumerableUpgradeable,
   PausableUpgradeable,
   ISCPNSComputilityRanking
{

    using CountersUpgradeable for CountersUpgradeable.Counter;

    //variable members
    string private _name;
    string private _symbol;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public proofTaskAddr;
    CountersUpgradeable.Counter _eventIndex;

    mapping (uint256 => uint256) private _id2Starts;
    mapping (uint256 => uint256) private _id2Ends;
    mapping (uint256 => uint256) private _id2ParameterIds;
    mapping (uint256 => uint256) private _id2TaskIds;

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

    function set(uint256 tokenId, uint256 start, uint25R6 end, uint256 parameterId, uint256 taskId) public whenNotPaused virtual override {
        require(hasRole(MANAGE_ROLE, _msgSender()), "SCPNSComputilityRanking: must have manager role to mint");

        _id2Starts[tokenId] = start;
        _id2Ends[tokenId] = end;
        _id2ParameterIds[tokenId] = parameterId;
        _id2TaskIds[tokenId] = taskId;
    }
}
