// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./SCPNSBase.sol";
import "./interface/ISCPNSComputilityVM.sol";
import "./interface/ISCPNSUseRightToken.sol";
import "./PairValues.sol";
import "./ContractProject.sol";


contract SCPNSUseRightToken is
   SCPNSBase,
   ContractProject,
   ISCPNSUseRightToken 
   {
     using CountersUpgradeable for CountersUpgradeable.Counter;
     using PairValues for PairValues.PairUint256;

     // Mapping from id to user 
     mapping (uint256 => address) private _users;
     // Mapping from id to deadline
     mapping (uint256 => uint256) private _deadlines;
     // Mapping from id to computility VM list
     mapping (uint256 => PairValues.PairUint256) private _tokenComputilityVMs;

    function initialize(address dns) public virtual initializer {
        __SCPNSBase_init("SCPNSUseRightToken", "SCPNSUseRightToken", "");
        __ContractProject_init(dns);
        __SCPNSUseRightToken_init();
    }
    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` to the
     * account that deploys the contract.
     *
     * Token URIs will be autogenerated based on `baseURI` and their token IDs.
     */
    function __SCPNSUseRightToken_init() internal initializer {
        __SCPNSUseRightToken_init_unchained();
    }

    function __SCPNSUseRightToken_init_unchained() internal initializer {
        _unitType("computilityvm");
    }

    function mint(address to, uint256 tokenId, uint256 deadline,
                  uint256[] memory computilityVMs, string memory datas) public virtual override whenNotPaused {

        require(computilityVMs.length > 0, 
                "SCPNSUseRightToken: computilityVMs length is 0");
        require(deadline > block.timestamp, "SCPNSUseRightToken: deadline is too small.");

        _mint(to, tokenId, bytes32(tokenId), datas);

        uint256 len = computilityVMs.length;
        for (uint256 i = 0; i < len; i++) {
            _tokenComputilityVMs[tokenId].set(computilityVMs[i], uint256(1));

            _computilityVMIf().lockResources(computilityVMs[i], deadline);
        }

        _deadlines[tokenId] = deadline;
    }

    function typeUnitIdOf(uint256 tokenId) public view virtual override returns(uint256) {
        uint256 len = _tokenComputilityVMs[tokenId].length();
        require(len > 0, "SCPNSComputilityVM: no computility unit ");

        uint256 computilityVMId = _tokenComputilityVMs[tokenId].keyOfByIndex(len - 1);
        return _computilityVMIf().typeUnitIdOf(computilityVMId);
    }

    function typeUnitCountOf(uint256 tokenId) public view virtual override returns(uint256) {
        uint256 len = _tokenComputilityVMs[tokenId].length();
        require(len > 0, "SCPNSUseRightToken: no computility ");

        uint256 total = 0;
        for(uint256 i = 0; i < len; i++) {
            total += _tokenComputilityVMs[tokenId].valueOfByIndex(i);
        }

        return total;
    }

    function ownerOf(uint256 tokenId) public view override(ERC721Upgradeable, ISCPNSUseRightToken) returns(address) {
        return ERC721Upgradeable.ownerOf(tokenId);
    }

    function deadLine(uint256 tokenId) public view virtual override returns(uint256) {
        return _deadlines[tokenId];
    }

    function isValid(uint256 tokenId) public view virtual override returns(bool) {
        return _deadlines[tokenId] > block.timestamp;
    }
     uint256[48] private __gap;
   }


