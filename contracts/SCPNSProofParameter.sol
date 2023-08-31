// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./SCPNSBase.sol";
import "./interface/ISCPNSTypeUnit.sol";
import "./interface/ISCPNSProofParameter.sol";
import "./ContractProject.sol";

/**
 * @dev {SCPNSProofParameter} token, including:
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
contract SCPNSProofParameter is 
    SCPNSBase,
    ContractProject,
    ISCPNSProofParameter
    {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // Mapping from id to parameter list
    mapping (uint256 => mapping(bytes32 => uint256)) internal _id2Parameters;
    // Mapping from id to parameter name list
    mapping (uint256 => mapping(uint256 => bytes32)) internal _id2ParameterNames;
    // Mapping from id to parameter name count
    mapping (uint256 => CountersUpgradeable.Counter) internal _id2ParameterCount;
    // Mapping from id to typeUnitId
    mapping (uint256 => uint256) internal _id2TypeUnitId;
    // Mapping from typeUnitId to id
    mapping (uint256 => uint256) internal _typeUnitId2Id;

    function initialize(address dns) public virtual initializer {
        __SCPNSBase_init("SCPNSProofParameter", "SCPNSProofParameter", "");
        __ContractProject_init(dns);
        __SCPNSProofParameter_init();
    }
    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` to the
     * account that deploys the contract.
     *
     * Token URIs will be autogenerated based on `baseURI` and their token IDs.
     */
    function __SCPNSProofParameter_init() internal initializer {
        __SCPNSProofParameter_init_unchained();
    }

    function __SCPNSProofParameter_init_unchained() internal initializer {
        _unitType("types");
    }

    /**
     * @dev Creates a new token for `to`. Its token ID will be tokenId
     * URI autogenerated based on the base URI passed at construction.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint256 tokenId, bytes32 name_, uint256 typeUnitId, string memory datas) public virtual override{
        require(_id2TypeUnitId[tokenId] == uint256(0), "SCPNSProofParameter: tokenId is exists.");
        require(_typeUnitIf().exists(typeUnitId), "SCPNSProofParameter: typeUnitId is invalid.");
        require(_typeUnitId2Id[typeUnitId] == uint256(0), "SCPNSProofParameter: typeUnitId was setting.");

        _id2TypeUnitId[tokenId] = typeUnitId;
        _typeUnitId2Id[typeUnitId] = tokenId;

        _mint(to, tokenId, name_, datas);

    }

    function setValueOfParameter(uint256 tokenId, bytes32 pname, uint256 pvalue) public virtual override {
        require(hasRole(MANAGE_ROLE, _msgSender()), "SCPNSProofParameter: must have manager role to remove");
        __setValueOfParameter(tokenId, pname, pvalue);
    }

    function valueOfParameter(uint256 tokenId, bytes32 pname) public view override returns(uint256) {
        return _id2Parameters[tokenId][pname];
    }

    function typeUnitIdOf(uint256 tokenId) public view override returns(uint256) {
        return _id2TypeUnitId[tokenId];
    }

    function tokenIdOfTypeUnitId(uint256 typeUnitId) public view override returns(uint256) {
        return _typeUnitId2Id[typeUnitId];
    }

    function parameterCountOf(uint256 tokenId) public view override returns(uint256) {
        return _id2ParameterCount[tokenId].current();
    }

    function parameterNameOf(uint256 tokenId, uint256 index) public view virtual override returns(bytes32) {
        require(index < _id2ParameterCount[tokenId].current(), "SCPNSProofParameter: index out of bounds.");
        return _id2ParameterNames[tokenId][index];
    }

    function parametersOf(uint256 tokenId) public view virtual override returns(bytes32[] memory names, uint256[] memory values) {
        uint256 index = _id2ParameterCount[tokenId].current();
        uint i = 0;
        while(index > 0) {
            bytes32 pname = _id2ParameterNames[tokenId][index - 1];
            names[i] = pname;
            values[i] = _id2Parameters[tokenId][pname];
            index = index - 1;
            i = i + 1;
        }
    }
    
    function _burn(uint256 tokenId) internal virtual override(SCPNSBase) {
        super._burn(tokenId);

        while(_id2ParameterCount[tokenId].current() > 0) {
            _id2ParameterCount[tokenId].decrement();
            delete _id2Parameters[tokenId][_id2ParameterNames[tokenId][_id2ParameterCount[tokenId].current()]];
            delete _id2ParameterNames[tokenId][_id2ParameterCount[tokenId].current()];
        }
        delete _id2ParameterCount[tokenId];

        uint256 typeUnitId = _id2TypeUnitId[tokenId];
        delete _typeUnitId2Id[typeUnitId];

        delete _id2TypeUnitId[tokenId];

    }

    function __setValueOfParameter(uint256 tokenId, bytes32 pname, uint256 pvalue) internal virtual {
        require(_exists(tokenId), "SCPNSProofParameter: tokenId is not exists.");
        require(pname != bytes32(""), "SCPNSProofParameter: pname is invalid.");

        // mabe is new parameter, check it and add to name list
        if (uint256(0) == _id2Parameters[tokenId][pname]) {
            uint256 index = _id2ParameterCount[tokenId].current();
            while(index > 0) {
                if (_id2ParameterNames[tokenId][index - 1] == pname) {
                    break;
                }
                index = index - 1;
            }
            if (index == 0) {
                _id2ParameterCount[tokenId].increment();
                _id2ParameterNames[tokenId][_id2ParameterCount[tokenId].current()] = pname;
            }
        }

        _id2Parameters[tokenId][pname] = pvalue;
    }

    uint256[48] private __gap;
}
