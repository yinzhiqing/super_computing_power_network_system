// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./SCPNSBase.sol";
import "./interface/ISCPNSVerifyTask.sol";
import "./interface/ISCPNSProofTask.sol";
import "./interface/ISCPNSUseRightToken.sol";
import "./interface/ISCPNSProofParameter.sol";
import "./interface/ISCPNSComputilityRanking.sol";
import "./ContractProject.sol";
import "./PairValues.sol";
import "./ArraryUint256.sol";
import "./ArrayAddresses.sol";

contract SCPNSVerifyTask is 
  SCPNSBase, 
  ContractProject,
  ISCPNSVerifyTask {
        
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using ArrayUnit256 for ArrayUnit256.Uint256s;
    using PairValues for PairValues.PairUint256;
    using ArrayAddresses for ArrayAddresses.PairAddress;

    // The block number where the previous event was located.
    uint256 private _preBlockNumber;
    // Task index(0~n)
    CountersUpgradeable.Counter private _eventIndex;
    // Task Id Generator
    CountersUpgradeable.Counter private _idGenerator;

    uint256 private _waitBlockNumber;

    // Mapping from id to useRightId
    mapping (uint256 => uint256) private _id2UseRightId;
    // Mapping from useRightId to id;
    mapping (uint256 => uint256) private _useRightId2Id;
    // Mapping from id to VerifyParameter;
    mapping (uint256 => VerifyParameter) private _id2VerifyParameter;
    // Mapping from useRightId to VerifyDetail
    mapping (uint256 => VerifyStat) private _useRightId2VerifyStat;
    // Mapping from sender to id
    mapping (address => ArrayUnit256.Uint256s) private _ownedTokens;

    function initialize() 
    initializer 
    public 
    {
        __SCPNSVerifyTask_init();

    }
    function __SCPNSVerifyTask_init()
    internal 
    initializer 
    {
        __SCPNSBase_init("SCPNSVerifyTask", "SCPNSVerifyTask", "");
        __SCPNSVerifyTask_init_unchained();
    }

    function __SCPNSVerifyTask_init_unchained() 
    internal initializer 
    {
        _unitType("verifytask");
        _waitBlockNumber = 5;
    }

    function mint(uint256 useRightId, bytes32 q, string memory datas) public virtual override {
        require(!_proofTaskIf().isInProofOfUseRightId(useRightId), "SCPNSVerifyTask: useRight token is in proof");
        require(!SCPNSVerifyTask.isInVerifyOfUseRightId(useRightId), "SCPNSVerifyTask: useRight token is in verify");

        (, , uint256 taskId, bool has) 
              = _proofTaskIf().latestParametersByUseRightId(useRightId);
        require(has, "SCPNSVerifyTask: useRight token none data to verify");

        //update old
        _updateVerifyState(useRightId);

        uint256 tokenId = _idGenerator.current();
        _mint(_msgSender(), tokenId, NO_NAME, datas);

        VerifyParameter storage vp = _id2VerifyParameter[tokenId];
        vp.q = q;
        vp.state = VerifyState.Start;
        vp.taskId = taskId;
        vp.startBlockNumber = block.number;

        VerifyStat storage vs = _useRightId2VerifyStat[tokenId];
        vs.total += 1;

        emit TaskData(_eventIndex.current(), useRightId, _preBlockNumber, _msgSender(), vp, datas);

        // next mint use 
        _idGenerator.increment();
        _preBlockNumber = block.number;
        _eventIndex.increment();
        _ownedTokens[_msgSender()].add(tokenId);
    }


    function isInVerifyOf(uint256 tokenId) public view virtual override returns(bool) {
        require(_exists(tokenId), "SCPNSVerifyTask: token is nonexists");
        return _isVerifyOf(tokenId);

    }

    function isInVerifyOfUseRightId(uint256 tokenId) public view virtual override returns(bool) {
        return SCPNSVerifyTask.isInVerifyOf(_useRightId2Id[tokenId]);
    }

    function _updateVerifyState(uint256 useRightId) internal {
        uint256 tokenId = _useRightId2Id[useRightId];
    
        VerifyParameter storage vp = _id2VerifyParameter[tokenId];
        VerifyStat storage vs = _useRightId2VerifyStat[useRightId];
        if (vp.state == VerifyState.Start && vp.startBlockNumber < block.number + _waitBlockNumber) {
            vp.state = VerifyState.Error;
            vs.failed += 1;
        }
    }

    function _isVerifyOf(uint256 tokenId)  internal view returns(bool) {
        VerifyParameter storage vp = _id2VerifyParameter[tokenId];
        return vp.state == VerifyState.Start && vp.startBlockNumber < block.number + _waitBlockNumber;
    }

    function _burn(uint256 tokenId) internal virtual override(SCPNSBase) {
        super._burn(tokenId);
        uint256 useRightId = _id2UseRightId[tokenId];
        delete _useRightId2Id[useRightId];
        delete _id2UseRightId[tokenId];
        delete _id2VerifyParameter[tokenId];

    }
    //must be at end
    uint256[48] private __gap;
}

