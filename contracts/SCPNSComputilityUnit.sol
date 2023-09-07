
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./SCPNSBase.sol";
import "./interface/ISCPNSComputilityUnit.sol";
import "./interface/ISCPNSTypeUnit.sol";
import "./ContractProject.sol";

/**
 * @dev {SCPNSComputilityUnit} token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - a minter role that allows for token minting (creation)
 *  - a pauser role that allows to stop all token transfers
 *  - token ID and URI autogeneration
 *
 * This contract uses {AccessControl} to lock permissioned functions using the
 * different roles - head to its documentation for details.
 *
 * The account that deploys the contract will be granted the minter and pauser
 * roles, as well as the default admin role, which will let it grant both minter
 * and pauser roles to other accounts.
 */
contract SCPNSComputilityUnit is 
    SCPNSBase,
    ContractProject,
    ISCPNSComputilityUnit
    {

    /**
    *  @dev storage struct
    *  
    * owner => [index => id]
    *                     |-=> typeUnitCount
    *                     |-=> unitTypeId   
    *                            |-=> countOfOwner
    *                            |-=> allCount
    *                     |-=> idIndex 
    *                     |-=> owner
    *                            |-=> balance
    */

    // Mapping from id to typeUnit id
    mapping (uint256 => uint256) internal _id2TypeUnitId;
    // Mapping from id to typeUnit Count
    mapping (uint256 => uint256) internal _id2TypeUnitCount;
    // Mapping from id to locked count
    mapping (uint256 => uint256) internal _id2TypeUnitCountLocked;
    // Mapping from typeUnit id to count(all)
    mapping (uint256 => uint256) internal _typeUnit2Count;
    // Mapping from owner to typeUnitId count
    mapping (address => mapping (uint256 => uint256)) internal _ownedTypeUnitCount;
    // Mapping from owner to locked typeUnitId count 
    mapping (address => mapping (uint256 => uint256)) internal _ownedTypeUnitCountLocked;

    function initialize(address dns) public virtual initializer {
        __SCPNSBase_init("SCPNSComputilityUnit", "SCPNSComputilityUnit", "");
        __ContractProject_init(dns);
        __SCPNSComputilityUnit_init();
    }
    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` to the
     * account that deploys the contract.
     *
     * Token URIs will be autogenerated based on `baseURI` and their token IDs.
     */
    function __SCPNSComputilityUnit_init() internal initializer {
        __SCPNSComputilityUnit_init_unchained();
    }

    function __SCPNSComputilityUnit_init_unchained() internal initializer {
        _unitType("computilityunit");
    }

    /**
     * @dev Creates a new token for `to`. Its token ID will be tokenId
     * URI autogenerated based on the base URI passed at construction.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint256 tokenId, uint256 typeUnitId, uint256 typeUnitCount_, string memory datas) public whenNotPaused virtual override {

        require(_typeUnitIf().exists(typeUnitId), "SCPNSComputilityUnit: typeUnitId is not exists.");
        require(typeUnitCount_ > 0, "SCPNSComputilityUnit: The typeUnit quantity value must be greater than 0");

        bytes32 _name = bytes32(tokenId);
        _mint(to, tokenId, _name, datas);
        _addTokenToAll(to, tokenId, typeUnitId, typeUnitCount_);

    }

    function lockResources(uint256 tokenId, uint256 typeUnitCount) public virtual override whenNotPaused {
        require(_exists(tokenId), "SCPNSComputilityUnit: token is nonexists");

        uint256 typeUnitId = _id2TypeUnitId[tokenId];
        address owner = super.ownerOf(tokenId);
        uint256 lockedCount = _id2TypeUnitCountLocked[tokenId];
        uint256 allCount = _id2TypeUnitCount[tokenId];

        require(_msgSender() == owner || hasRole(MANAGER_ROLE, _msgSender()) || hasRole(CONTROLLER_ROLE, _msgSender()), 
                "SCPNSComputilityUnit: must have manager(controller) role to locking or owner of token");
        require(typeUnitCount + lockedCount <= allCount, "SCPNSComputilityUnit: resources cannot meet demand");

       _ownedTypeUnitCountLocked[owner][typeUnitId] += typeUnitCount;
       _id2TypeUnitCountLocked[tokenId] += typeUnitCount;
    }

    function unlockResources(uint256 tokenId, uint256 typeUnitCount) public virtual override whenNotPaused {
        require(_exists(tokenId), "SCPNSComputilityUnit: token is nonexists");

        uint256 typeUnitId = _id2TypeUnitId[tokenId];
        address owner = super.ownerOf(tokenId);
        uint256 lockedCount = _id2TypeUnitCountLocked[tokenId];

        require(_msgSender() == owner || hasRole(MANAGER_ROLE, _msgSender()) || hasRole(CONTROLLER_ROLE, _msgSender()), 
                "SCPNSComputilityUnit: must have manager(controller)) role to locking or owner of token");
        require(typeUnitCount <= lockedCount, "SCPNSComputilityUnit: resources cannot meet demand");

       _ownedTypeUnitCountLocked[owner][typeUnitId] -= typeUnitCount;
       _id2TypeUnitCountLocked[tokenId] -= typeUnitCount;
    }

    function leaveCountOf(uint256 tokenId) public view override returns(uint256) {
        return _id2TypeUnitCount[tokenId] - _id2TypeUnitCountLocked[tokenId];
    }

    function countOfTypeUnit(uint256 typeUnitId) public view override returns(uint256) {
        return _typeUnit2Count[typeUnitId];
    }

    function typeUnitIdOf(uint256 tokenId) public view virtual override returns(uint256) {
        return _id2TypeUnitId[tokenId];
    }

    function typeUnitCountOf(uint256 tokenId) public view virtual override returns(uint256) {
        uint256 typeUnitCount = _id2TypeUnitCount[tokenId];
        return typeUnitCount;
    }

    /*
    function ownerOf(uint256 tokenId) public view virtual override(ERC721Upgradeable, ISCPNSComputilityUnit) returns(address) {
        return super.ownerOf(tokenId);
    }
    */
   
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        if (from == address(0)) {
            // parameters can't input sou move mint interface or use it space
        } else if (from != to) {
            _removeTokenFromOwner(from, tokenId);
        }
        if (to == address(0)) {
            _removeTokenFromAll(tokenId);
        } else if (to != from) {
            _addTokenToOwner(to, tokenId);
        }
    }

    function _addTokenToAll(address to, uint256 tokenId, uint256 typeUnitId, uint256 typeUnitCount_) private {
        _id2TypeUnitCount[tokenId] = typeUnitCount_;
        _ownedTypeUnitCount[to][typeUnitId] += typeUnitCount_;
        _ownedTypeUnitCountLocked[to][typeUnitId] = 0;
        

        _id2TypeUnitCountLocked[tokenId] = 0;
        _id2TypeUnitId[tokenId] = typeUnitId;
        // all count of typeUnitId
        _typeUnit2Count[typeUnitId] += typeUnitCount_;

    }

    function _addTokenToOwner(address to, uint256 tokenId) private {
        // @dev change owner computility count 
        uint256 typeUnitId = _id2TypeUnitId[tokenId];

        uint256 typeUnitCount = _id2TypeUnitCount[tokenId];
        _ownedTypeUnitCount[to][typeUnitId] += typeUnitCount;

        uint256 typeUnitCountLocked = _id2TypeUnitCountLocked[tokenId];
        _ownedTypeUnitCountLocked[to][typeUnitId] += typeUnitCountLocked;
    }

    function _removeTokenFromOwner(address from, uint256 tokenId) private {
        // @dev change owner computility count 
        uint256 typeUnitId = _id2TypeUnitId[tokenId];

        uint256 typeUnitCount = _id2TypeUnitCount[tokenId];
        _ownedTypeUnitCount[from][typeUnitId] -= typeUnitCount;

        uint256 typeUnitCountLocked = _id2TypeUnitCountLocked[tokenId];
        _ownedTypeUnitCountLocked[from][typeUnitId] -= typeUnitCountLocked;
    }

    function _removeTokenFromAll(uint256 tokenId) private {
        // Update all count of typeUnit
        address owner = super.ownerOf(tokenId);
        uint256 typeUnitId = _id2TypeUnitId[tokenId];
        uint256 typeUnitCount = _id2TypeUnitCount[tokenId];
        _typeUnit2Count[typeUnitId] -= typeUnitCount;
        _ownedTypeUnitCount[owner][typeUnitId] -= typeUnitCount;
    
        delete _id2TypeUnitId[tokenId];
        delete _id2TypeUnitCount[tokenId];
        delete _id2TypeUnitCountLocked[tokenId];
    }

    function _burn(uint256 tokenId) internal virtual override(SCPNSBase) {
        // must at before of super_burn(burn will remove onwer of token)
        _removeTokenFromAll(tokenId);
        super._burn(tokenId);
    }

    uint256[48] private __gap;
}
