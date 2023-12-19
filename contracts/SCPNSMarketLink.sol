// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "./interfaces/ISCPNSMarketLink.sol";
import "./refs/store/interfaces/IRevenueToken.sol";
import "./PairValues.sol";
import "./ArraryUint256.sol";
import "./ContractProject.sol";

contract SCPNSMarketLink is 
   Initializable,
   AccessControlEnumerableUpgradeable,
   PausableUpgradeable,
   ContractProject,
   ISCPNSMarketLink
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

    CountersUpgradeable.Counter _eventIndex;
    uint256 private __pricision;

    function initialize(string memory name_, string memory symbol_, address dns) 
    initializer 
    public 
    {
        __ContractProject_init(dns);
        __SCPNSMarketLink_init(name_, symbol_);

    }

    function __SCPNSMarketLink_init(string memory name_, string memory symbol_)
    internal 
    initializer 
    {
        __Pausable_init_unchained();
        __AccessControlEnumerable_init_unchained();
        __SCPNSMarketLink_init_unchained(name_, symbol_);
    }

    function __SCPNSMarketLink_init_unchained(string memory name_, string memory symbol_) 
    internal initializer 
    {
        _name   = name_;
        _symbol = symbol_;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MANAGER_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        //other init
        __pricision = _pricision();
    }


    function name() public view virtual returns(string memory) {
        return _name;
    }

    function symbol() public view virtual returns(string memory) {
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
        require(hasRole(PAUSER_ROLE, _msgSender()), 
                "SCPNSMarketLink: must have pauser role to pause");

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
        require(hasRole(PAUSER_ROLE, _msgSender()), 
                "SCPNSMarketLink: must have pauser role to unpause");

        _unpause();
    }

    function pricision() public view virtual override returns(uint256) {
        return __pricision;
    }

    function _pricision() internal view returns(uint256) {
        if (__pricision > 0) {
            return __pricision;
        }
        return (block.timestamp > 1000000000000) ? 1000 : 1;
    }


    function putToMarket(uint256 tokenId, uint256 price) public virtual override {
        require(_useRightTokenIf().exists(tokenId), "SCPNSMarketLink: tokenId is not use right token");
        require(price > 0);

        _stdOfIf(address(_useRightTokenIf())).approve(address(_gpuStoreIf()), tokenId);

        _gpuStoreIf().addGpuTokenToStore(tokenId, price);
    }


    function revokeFromMarket(uint256 tokenId) public virtual override {
        require(_useRightTokenIf().exists(tokenId), "SCPNSMarketLink: tokenId is not use right token");

        _gpuStoreIf().removeGpuTokenFromStore(tokenId);

        _stdOfIf(address(_useRightTokenIf())).transferFrom(address(this), _msgSender(), tokenId);
    }

    function mintRevenue(uint256 tokenId, address[] memory owners, uint256[] memory values) public virtual override {
        uint256 __revenueValue = _computilityVMIf().revenueValueOf(tokenId);
        require(__revenueValue > 0, "SCPNSMarketLink: revenue value of tokenId is 0");
        require(owners.length == values.length, "SCPNSMarketLink: value len of owners is no-match");
        //check is mint?

        uint256 total = 0;
        for(uint256 i = 0; i < owners.length; i++) {
            total += values[i];
        }

        require(total == __revenueValue, "SCPNSMarketLink: revenue value allocation is unreasonable");

        _gpuStoreIf().mintGPUAndRevenuToken2(tokenId, owners, values);
    }
}

