// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./SCPNSBase.sol";
import "./interface/ISCPNSComputilityUnit.sol";
import "./interface/ISCPNSComputilityVM.sol";
import "./PairValues.sol";
import "./ContractProject.sol";


contract SCPNSComputilityVM is
   SCPNSBase,
   ContractProject,
   ISCPNSComputilityVM 
   {
     using CountersUpgradeable for CountersUpgradeable.Counter;
     using PairValues for PairValues.PairUint256;

     // Mapping from id to user 
     mapping (uint256 => address) private _users;
     // Mapping from id to deadline
     mapping (uint256 => uint256) private _deadlines;
     // Mapping from id to computility units list
     mapping (uint256 => PairValues.PairUint256) private _tokenComputilityUnits;
     //
     mapping (uint256 => uint256) private _lockLines;

    function initialize(address dns) public virtual initializer {
        __SCPNSBase_init("SCPNSComputilityVM", "SCPNSComputilityVM", "");
        __ContractProject_init(dns);
        __SCPNSComputilityVM_init();
    }
    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` to the
     * account that deploys the contract.
     *
     * Token URIs will be autogenerated based on `baseURI` and their token IDs.
     */
    function __SCPNSComputilityVM_init() internal initializer {
        __SCPNSComputilityVM_init_unchained();
    }

    function __SCPNSComputilityVM_init_unchained() internal initializer {
        _unitType("computilityvm");
    }

    function mint(address to, uint256 tokenId, uint256 deadline,
                  uint256[] memory computilityUnits, uint256[] memory typeUnitCounts, 
                  string memory datas) public virtual override whenNotPaused {

        require(computilityUnits.length == typeUnitCounts.length, 
                "SCPNSComputilityVM: computilityUnits and typeUnitCounts length is differ");
        require(deadline > block.timestamp, "SCPNSComputilityVM: deadline is too small.");

        _mint(to, tokenId, bytes32(tokenId), datas);

        uint256 len = computilityUnits.length;
        for (uint256 i = 0; i < len; i++) {
            _tokenComputilityUnits[tokenId].set(computilityUnits[i], typeUnitCounts[i]);

            _computilityUnitIf().lockResources(computilityUnits[i], typeUnitCounts[i]);
        }

        _deadlines[tokenId] = deadline;
    }

    function changeUser(address to, uint256 tokenId) public virtual override whenNotPaused {
        require(_msgSender() == super.ownerOf(tokenId) || super.isController(_msgSender()), 
                "SCPNSComputilityVM: only owner of token can change user");
        require(to != address(0), "SCPNSComputilityVM: new user address is address(0)");
        require(!_exists(tokenId), "SCPNS: token is nonexists.");

        _users[tokenId] = to;
    }

    function lockResources(uint256 tokenId, uint256 lockline) public virtual override whenNotPaused {
        require(_msgSender() == super.ownerOf(tokenId) || super.isController(_msgSender()), 
                "SCPNSComputilityVM: only owner of token can change user");
        require(!_exists(tokenId), "SCPNS: token is nonexists.");
        require(lockline <= _deadlines[tokenId], "SCPNSComputilityVM: locked time > deadline");

        _lockLines[tokenId] = lockline;
    }

    function typeUnitIdOf(uint256 tokenId) public view virtual override returns(uint256) {
        uint256 len = _tokenComputilityUnits[tokenId].length();
        require(len > 0, "SCPNSComputilityVM: no computility unit ");

        uint256 computilityUnitId = _tokenComputilityUnits[tokenId].keyOfByIndex(len - 1);
        return _computilityUnitIf().typeUnitIdOf(computilityUnitId);
    }

    function typeUnitCountOf(uint256 tokenId) public view virtual override returns(uint256) {
        uint256 len = _tokenComputilityUnits[tokenId].length();

        uint256 total = 0;
        if (len > 0) {
            for(uint256 i = 0; i < len; i++) {
                total += _tokenComputilityUnits[tokenId].valueOfByIndex(i);
            }
        }

        return total;

    }

    function deadLine(uint256 tokenId) public view virtual override returns(uint256) {
        return _deadlines[tokenId];
    }

    function computilityUnitCountOf(uint256 tokenId) public view virtual override returns(uint256) {
        return _tokenComputilityUnits[tokenId].length();
    }

    function computilityUnitIdByIndex(uint256 tokenId, uint256 index) public view virtual override returns(uint256) {
        uint256 len = _tokenComputilityUnits[tokenId].length();
        require(len > index, "SCPNSComputilityVM: index out of bounds");

        return _tokenComputilityUnits[tokenId].keyOfByIndex(index);
        
    }
     uint256[48] private __gap;
   }


