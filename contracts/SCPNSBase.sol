// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interface/ISCPNSBase.sol";
import "./ArrayAddresses.sol";
import "./ContractProject.sol";

/**
 * @dev {SCPNSBase} token, including:
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
contract SCPNSBase is Initializable, ContextUpgradeable, AccessControlEnumerableUpgradeable, ERC721EnumerableUpgradeable, ERC721BurnableUpgradeable, ERC721PausableUpgradeable, ISCPNSBase {

    using CountersUpgradeable for CountersUpgradeable.Counter;
    using ArrayAddresses for ArrayAddresses.PairAddress;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant MANAGE_ROLE = keccak256("MANAGE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant USAGE_ROLE = keccak256("USAGE_ROLE");
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    string private _baseTokenURI;
    string internal __unitType;

    // Mapping  from token to datas
    mapping (uint256 => string) internal _tokenDatas;
    // Mapping from name to id
    mapping (bytes32 => uint256) internal _name2IDs;
    // Mapping from id to name
    mapping (uint256 => bytes32) internal _id2Names;
    // Auto controller
    ArrayAddresses.PairAddress internal  _autoControllers;

    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` to the
     * account that deploys the contract.
     *
     * Token URIs will be autogenerated based on `baseURI` and their token IDs.
     */
    function __SCPNSBase_init(string memory name_, string memory symbol_, string memory baseTokenURI) internal initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __AccessControl_init_unchained();
        __AccessControlEnumerable_init_unchained();
        __ERC721_init_unchained(name_, symbol_);
        __ERC721Enumerable_init_unchained();
        __ERC721Burnable_init_unchained();
        __Pausable_init_unchained();
        __ERC721Pausable_init_unchained();
        __SCPNSBase_init_unchained(baseTokenURI);
    }

    function __SCPNSBase_init_unchained(string memory baseTokenURI) internal initializer {

        _baseTokenURI = baseTokenURI;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(MANAGE_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
    /**
     * @dev Creates a new token for `to`. Its token ID will be tokenId
     * URI autogenerated based on the base URI passed at construction.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function _mint(address to, uint256 tokenId, bytes32 name_, string memory datas) internal virtual {
        require(hasRole(MINTER_ROLE, _msgSender()), "SCPNSBase: must have minter role to mint");
        require(!_exists(_name2IDs[name_]), "SCPNSBase: token name is exists.");

        super._mint(to, tokenId);

        _name2IDs[name_] = tokenId;
        _id2Names[tokenId] = name_;
        _tokenDatas[tokenId] = datas;

        emit UpdateDatas(_msgSender(), _msgSender(), tokenId, _id2Names[tokenId], datas);
    }

    /**
      * @dev Update datas of token
      *
    */
    function update(uint256 tokenId, string memory datas) public virtual override {

        _update(tokenId, datas);
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
    function pause() public virtual override {
        require(hasRole(PAUSER_ROLE, _msgSender()), "SCPNSBase: must have pauser role to pause");
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
    function unpause() public virtual override {
        require(hasRole(PAUSER_ROLE, _msgSender()), "SCPNSBase: must have pauser role to unpause");
        _unpause();
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlEnumerableUpgradeable, ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
      * @dev token datas
    */
    function datasOf(uint256 tokenId) public view virtual override returns(string memory) {
        return _tokenDatas[tokenId];
    }

    /**
      * @dev token name
    */
    function nameOf(uint256 tokenId) public view virtual override returns(bytes32) {
        return _id2Names[tokenId];
    }

    /**
      * @dev token id
    */
    function tokenIdOf(bytes32 name_) public view virtual override returns(uint256) {
        return _name2IDs[name_];
    }

    function unitType() public view virtual override returns(string memory) {
        return __unitType;
    }

    function isController(address controller) public view virtual override returns(bool) {
        return hasRole(CONTROLLER_ROLE, controller);
    }

    function _unitType(string memory unitType_) internal virtual {
        __unitType = unitType_;
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721Upgradeable) {
        
        delete _tokenDatas[tokenId];

        bytes32 name_ = _id2Names[tokenId];
        delete _name2IDs[name_];
        delete _id2Names[tokenId];

        super._burn(tokenId);
    }


    function _update(uint256 tokenId, string memory datas) internal virtual {
        require(hasRole(MINTER_ROLE, _msgSender()), "SCPNSBase: must have minter role to mint");
        require(_exists(tokenId), "SCPNSBase: operator query for nonexistent token.");

        _tokenDatas[tokenId] = datas;

        emit UpdateDatas(_msgSender(), _msgSender(), tokenId, _id2Names[tokenId], datas);

    }
    
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721PausableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }


    function exists(uint256 tokenId) public view virtual override(ISCPNSBase) returns(bool) {
        return _exists(tokenId);
    }
    uint256[48] private __gap;
}
