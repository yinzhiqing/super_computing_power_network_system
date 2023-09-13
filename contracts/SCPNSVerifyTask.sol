// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
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

    bool public constant PATH_LEFT = true;
    bool public constant PATH_RIGHT = true;

    // The block number where the previous event was located.
    uint256 private _preBlockNumber;
    // Task index(0~n)
    CountersUpgradeable.Counter private _eventIndex;
    // Task Id Generator
    CountersUpgradeable.Counter private _idGenerator;

    uint256 private _waitBlockNumber;

    // Mapping from id to useRightId
    mapping (uint256 => uint256) private _id2UseRightId;
    // Mapping from useRightId to last id;
    mapping (uint256 => uint256) private _useRightId2Id;
    // Mapping from useRightId to VerifyParameter;
    mapping (uint256 => VerifyParameter) private _useRightId2VerifyParameter;
    // Mapping from useRightId to VerifyDetail
    mapping (uint256 => VerifyStat) private _useRightId2VerifyStat;
    // Mapping from sender to id
    mapping (address => ArrayUnit256.Uint256s) private _tokensSender;

    function initialize(address dns) 
    initializer 
    public 
    {
        __SCPNSVerifyTask_init(dns);

    }
    function __SCPNSVerifyTask_init(address dns)
    internal 
    initializer 
    {
        __SCPNSBase_init("SCPNSVerifyTask", "SCPNSVerifyTask", "");
        __ContractProject_init(dns);
        __SCPNSVerifyTask_init_unchained();
    }

    function __SCPNSVerifyTask_init_unchained() 
    internal initializer 
    {
        _unitType("verifytask");
        _waitBlockNumber = 5;
    }

    function mint(uint256 useRightId, uint256 proofId, bytes32 q, string memory datas) public virtual override {
        require(_proofTaskIf().exists(proofId), "SCPNSVerifyTask: proof task token is nonexists");
        require(!_proofTaskIf().isInProofOfUseRightId(useRightId), "SCPNSVerifyTask: useRight token is in proof");
        require(!SCPNSVerifyTask.isInVerifyOfUseRightId(useRightId), "SCPNSVerifyTask: useRight token is in verify");

        (, , uint256 curProofId, bool has) = _proofTaskIf().latestParametersByUseRightId(useRightId);
        require(has, "SCPNSVerifyTask: useRight token none data to verify");
        require(proofId == curProofId, "SCPNSVerifyTask: proof task token is too old");

        //update old
        _updateVerifyState(useRightId);

        uint256 tokenId = _idGenerator.current();
        _mint(_stdIf(ContractProject.DNS_NAME_PROOFTASK).ownerOf(proofId), tokenId, NO_NAME, datas);

        VerifyParameter storage vp = _useRightId2VerifyParameter[useRightId];
        vp.q = q;
        vp.state = VerifyState.Start;
        vp.proofId = proofId;
        vp.tokenId = tokenId;
        vp.startBlockNumber = block.number;

        VerifyStat storage vs = _useRightId2VerifyStat[tokenId];
        vs.total += 1;

        emit TaskData(_eventIndex.current(), useRightId, _preBlockNumber, _msgSender(), vp, datas);

        // next mint use 
        _idGenerator.increment();
        _preBlockNumber = block.number;
        _eventIndex.increment();
        _tokensSender[_msgSender()].add(tokenId);
    }

    function taskVerify(uint256 tokenId, uint256 a, bytes32[] memory proof) public virtual override whenNotPaused {
        require(_useRightTokenIf().exists(_id2UseRightId[tokenId]), "SCPNSVerifyTask: useRight token is nonexists");
        require(SCPNSVerifyTask.isInVerifyOf(tokenId), 
                "SCPNSVerifyTask: token is not in verify(state != start or timeout)");
        require(_msgSender() == super.ownerOf(tokenId), "SCPNSVerifyTask: must be owner of token");

        VerifyStat storage vs = _useRightId2VerifyStat[tokenId];
        VerifyParameter storage vp = _useRightId2VerifyParameter[tokenId];
        vp.verifyBlockNumber = block.number;
        vp.a = a;
        for (uint256 i = 0; i < proof.length; i++) {
            vp.proof.push(proof[i]);
        }

        bool __valid = _is_valid_proof(tokenId, proof);
        if (!__valid) {
            vs.failed += 1;
        } else {
            vs.succees += 1;
        }
        vp.state = VerifyState.End;

        emit TaskData(_eventIndex.current(), _id2UseRightId[tokenId], _preBlockNumber, _msgSender(), vp, "{}");

        // next mint use 
        _preBlockNumber = block.number;
        _eventIndex.increment();
    }

    function _is_valid_proof(uint256 tokenId, bytes32[] memory proof) internal view returns(bool) {
        VerifyParameter storage vp = _useRightId2VerifyParameter[tokenId];
        uint256 proofId = vp.proofId;
        bytes32 q = vp.q;
        bytes32 merkleRoot = _proofTaskIf().merkleRootOf(proofId);


        //bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(addr, amount))));
        return MerkleProofUpgradeable.verify(proof, merkleRoot, q);
    }

    function taskEnd(uint256 tokenId, uint256 sa) public virtual override whenNotPaused {
        require(_useRightTokenIf().exists(_id2UseRightId[tokenId]), "SCPNSVerifyTask: useRight token is nonexists");
        require(_tokensSender[_msgSender()].exists(tokenId), "SCPNSVerifyTask: must be owner of token");

        VerifyStat storage vs = _useRightId2VerifyStat[tokenId];
        VerifyParameter storage vp = _useRightId2VerifyParameter[tokenId];
        vp.endBlockNumber = block.number;
        vp.state = VerifyState.End;
        vp.sa = sa;

        if (vp.sa == sa) {
            vs.succees += 1;
        } else {
            vs.failed += 1;
        }

        emit TaskData(_eventIndex.current(), _id2UseRightId[tokenId], _preBlockNumber, _msgSender(), vp, "");

        // next mint use 
        _preBlockNumber = block.number;
        _eventIndex.increment();
    }

    function eventCountOf() public view virtual override returns(uint256) {
        return _eventIndex.current();
    }

    function useRightIdOf(uint256 tokenId) public view virtual override returns(uint256) {
        return _id2UseRightId[tokenId];
    }

    function isInVerifyOf(uint256 tokenId) public view virtual override returns(bool) {
        require(_exists(tokenId), "SCPNSVerifyTask: verify task token is nonexists");
        return _isInVerifyOf(tokenId);
    }

    function isInVerifyOfUseRightId(uint256 tokenId) public view virtual override returns(bool) {
        return SCPNSVerifyTask.isInVerifyOf(_useRightId2Id[tokenId]);
    }

    function proofParametersByUseRightId(uint256 tokenId) public view virtual override returns(bytes32 dynamicData, string memory parameter, uint256 proofId, bool has) {

        (dynamicData, parameter, proofId, has) = _proofTaskIf().latestParametersByUseRightId(tokenId);
    }

    function canVerifyOfUseRightId(uint256 tokenId) public view virtual override returns(bool) {
        (,,, bool has) = _proofTaskIf().latestParametersByUseRightId(tokenId);
        return has && !SCPNSVerifyTask.isInVerifyOfUseRightId(tokenId) && !_proofTaskIf().isInProofOfUseRightId(tokenId);
    }

    function hasVerifyTask(uint256 useRightId) public view virtual override returns(bool) {
        return VerifyState.Start ==_useRightId2VerifyParameter[useRightId].state;
    }

    function VerifyParameterOf(uint256 useRightId) public view virtual override returns(
        uint256 tokenId, bytes32 q, VerifyState state) {

        VerifyParameter storage vp = _useRightId2VerifyParameter[useRightId];
        tokenId = vp.tokenId;
        q = vp.q;
        state = vp.state;
    }

    function _updateVerifyState(uint256 useRightId) internal {
        uint256 tokenId = _useRightId2Id[useRightId];
    
        VerifyParameter storage vp = _useRightId2VerifyParameter[tokenId];
        VerifyStat storage vs = _useRightId2VerifyStat[useRightId];
        if (vp.state == VerifyState.Start && block.number < vp.startBlockNumber + _waitBlockNumber) {
            vp.state = VerifyState.Error;
            vs.failed += 1;
        }
        if (vp.state == VerifyState.Verify && block.number < vp.endBlockNumber + _waitBlockNumber) {
            vp.state = VerifyState.Error;
        }
    }

    function _isInVerifyOf(uint256 tokenId)  internal view returns(bool) {
        VerifyParameter storage vp = _useRightId2VerifyParameter[tokenId];
        return vp.state == VerifyState.Start && block.number > vp.startBlockNumber + _waitBlockNumber;
    }

    function _burn(uint256 tokenId) internal virtual override(SCPNSBase) {
        super._burn(tokenId);
        uint256 useRightId = _id2UseRightId[tokenId];
        delete _useRightId2Id[useRightId];
        delete _id2UseRightId[tokenId];
        delete _useRightId2VerifyParameter[tokenId];

    }
    //must be at end
    uint256[48] private __gap;
}

