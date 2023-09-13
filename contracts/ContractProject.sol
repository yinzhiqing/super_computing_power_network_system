// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "./interface/ISCPNSDns.sol";
import "./interface/ISCPNSBase.sol";
import "./interface/ISCPNSComputilityRanking.sol";
import "./interface/ISCPNSComputilityUnit.sol";
import "./interface/ISCPNSComputilityVM.sol";
import "./interface/ISCPNSProofParameter.sol";
import "./interface/ISCPNSProofTask.sol";
import "./interface/ISCPNSTypeUnit.sol";
import "./interface/ISCPNSUseRightToken.sol";
import "./interface/ISCPNSGpuList.sol";
import "./interface/ISCPNSVerifyTask.sol";

abstract contract ContractProject is Initializable {

    string public constant DNS_NAME_COMPUTILITYRANKING  = "SCPNSComputilityRanking";
    string public constant DNS_NAME_COMPUTILITYUNIT     = "SCPNSComputilityUnit";
    string public constant DNS_NAME_COMPUTILITYVM       = "SCPNSComputilityVM";
    string public constant DNS_NAME_GPULIST             = "SCPNSGpuList";
    string public constant DNS_NAME_PROOFPARAMETER      = "SCPNSProofParameter";
    string public constant DNS_NAME_PROOFTASK           = "SCPNSProofTask";
    string public constant DNS_NAME_TYPEUNIT            = "SCPNSTypeUnit";
    string public constant DNS_NAME_USERIGHTTOKEN       = "SCPNSUseRightToken";
    string public constant DNS_NAME_CHALLENGE           = "SCPNSVerifyTask";

    address private __dnsAddress;
    ISCPNSDns private _dnsIf;

    function __ContractProject_init(address dns) internal initializer {
        __ContractProject_init_unchained(dns);
    }

    function __ContractProject_init_unchained(address dns) internal initializer {
        _dnsAddress(dns);
    }

    function _dnsAddress(address addr) internal virtual {
        __dnsAddress = addr;
        _dnsIf = ISCPNSDns(addr);
    }

    function _addressOf(string memory name_) internal view virtual returns(address) {
        require(_dnsIf.exists(name_), "SCPNSBase: the name of dns is invalid");
        return _dnsIf.addressOf(name_);
    }

    function _stdIf(string memory name_) internal view virtual returns(IERC721Upgradeable) {
        return IERC721Upgradeable(_addressOf(name_));
    }

    function _baseIf(string memory name_) internal view virtual returns(ISCPNSBase) {
        return ISCPNSBase(_addressOf(name_));
    }
    function _computilityRankingIf() internal view virtual returns(ISCPNSComputilityRanking) {
        return ISCPNSComputilityRanking(_addressOf(DNS_NAME_COMPUTILITYRANKING));
    }

    function _computilityUnitIf() internal view virtual returns(ISCPNSComputilityUnit) {
        return ISCPNSComputilityUnit(_addressOf(DNS_NAME_COMPUTILITYUNIT));
    }

    function _computilityVMIf() internal view virtual returns(ISCPNSComputilityVM) {
        return ISCPNSComputilityVM(_addressOf(DNS_NAME_COMPUTILITYVM));
    }

    function _gpuListIf() internal view virtual returns(ISCPNSGpuList) {
        return ISCPNSGpuList(_addressOf(DNS_NAME_GPULIST));
    }

    function _proofParameterIf() internal view virtual returns(ISCPNSProofParameter) {
        return ISCPNSProofParameter(_addressOf(DNS_NAME_PROOFPARAMETER));
    }

    function _proofTaskIf() internal view virtual returns(ISCPNSProofTask) {
        return ISCPNSProofTask(_addressOf(DNS_NAME_PROOFTASK));
    }

    function _typeUnitIf() internal view virtual returns(ISCPNSTypeUnit) {
        return ISCPNSTypeUnit(_addressOf(DNS_NAME_TYPEUNIT));
    }

    function _useRightTokenIf() internal view virtual returns(ISCPNSUseRightToken) {
        return ISCPNSUseRightToken(_addressOf(DNS_NAME_USERIGHTTOKEN));
    }

    function _verifyTaskIf() internal view virtual returns(ISCPNSVerifyTask) {
        return ISCPNSVerifyTask(_addressOf(DNS_NAME_CHALLENGE));
    }
}
