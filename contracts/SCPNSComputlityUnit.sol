
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./SCPNSBase.sol";
import "./interface/ISCPNSTypeUnit.sol";

/**
 * @dev {SCPNSComputiltyUnit} token, including:
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
contract SCPNSComputiltyUnit is 
    SCPNSBase
    {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // typeUnit contract address 
    address public typeUnitAddr;

    ISCPNSTypeUnit internal _typeUnitIf;

    // Mapping from id to typeUnit id
    mapping (uint256 => uint256) internal _id2TypeUnitId;
    // Mapping from id to id count
    mapping (uint256 => uint256) internal _id2Count;
    // Mapping from comptility id to unit(gpu/memory) id 
    mapping (address => mapping (uint256 => uint256)) internal _ownedTokens;
    // Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) private _ownedTokensIndex;
    // Mapping from token ID to owner address
    mapping (uint256 => address) private _owners;
    // Mapping owner address to token count
    mapping (address => uint256) private _balances;

    function initialize(address typeUnitAddr_) public virtual initializer {
        __SCPNSBase_init("SCPNSComputiltyUnit", "SCPNSComputiltyUnit", "");
        __SCPNSComputiltyUnit_init(typeUnitAddr_);
    }
    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` to the
     * account that deploys the contract.
     *
     * Token URIs will be autogenerated based on `baseURI` and their token IDs.
     */
    function __SCPNSComputiltyUnit_init(address typeUnitAddr_) internal initializer {
        __SCPNSComputiltyUnit_init_unchained(typeUnitAddr_);
    }

    function __SCPNSComputiltyUnit_init_unchained(address typeUnitAddr_) internal initializer {
        _unitType("types");
        typeUnitAddr = typeUnitAddr_;
        _typeUnitIf = ISCPNSTypeUnit(typeUnitAddr_);
    }

    /**
     * @dev Creates a new token for `to`. Its token ID will be tokenId
     * URI autogenerated based on the base URI passed at construction.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint256 tokenId, uint256 typeUnitId, uint256 count, string memory datas) public virtual {

        require(_typeUnitIf.exists(typeUnitId), "SCPNSComputiltyUnit: typeUnitId is not exists.");
        bytes32 _name = bytes32(tokenId);
        _mint(tokenId, _name, datas);

        uint256 length = SCPNSComputiltyUnit.balanceOf(to);
        _ownedTokens[to][length] = tokenId;
        _ownedTokensIndex[tokenId] = length;
        _owners[tokenId] = to;
        _balances[to] += 1;

        _id2TypeUnitId[tokenId] = typeUnitId;
        _id2Count[tokenId] = count;

        UpdateDatas(tokenId, _name, _msgSender(), datas);
    }

    function balanceOf(address owner) public view virtual returns (uint256) {
        require(owner != address(0), "SCPNSComputiltyUnit: balance query for the zero address");
        return _balances[owner];
    }

    /**
     * @dev See {IZXX-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "SCPNSComputiltyUnit: owner query for nonexistent token");
        return owner;
    }

    function typeUnitOf(uint256 tokenId) public view virtual returns(uint256) {
        return _id2TypeUnitId[tokenId];
    }

    function countOf(uint256 tokenId) public view virtual returns(uint256) {
        return _id2Count[tokenId];
    }

    function burn(uint256 tokenId)
    public
    virtual
    override
    {
        delete _id2TypeUnitId[tokenId];
        delete _id2Count[tokenId];
        _removeTokenFromOwner(_owners[tokenId], tokenId);

        _balances[_owners[tokenId]] -= 1;
        delete _owners[tokenId];

        _burn(tokenId);
    }

    function _removeTokenFromOwner(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = SCPNSComputiltyUnit.balanceOf(from) - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

            _ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
            _ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
        }

        // This also deletes the contents at the last position of the array
        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
    }
    uint256[48] private __gap;
}
