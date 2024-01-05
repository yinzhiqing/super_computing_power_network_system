// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "./SCPNSBase.sol";
import "./interfaces/ISCPNSVerifyTask.sol";
import "./interfaces/ISCPNSProofTask.sol";
import "./interfaces/ISCPNSUseRightToken.sol";
import "./interfaces/ISCPNSProofParameter.sol";
import "./interfaces/ISCPNSComputilityRanking.sol";
import "./ContractProject.sol";
import "./PairValues.sol";
import "./ArraryUint256.sol";
import "./ArrayAddresses.sol";
import "./MerkleProofUpgradableSha256.sol";

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
    // Mapping from id to VerifyParameter;
    mapping (uint256 => VerifyParameter) private _id2VerifyParameter;
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
        _waitBlockNumber = 300; //10 minute
    }

    function mint(uint256 useRightId, uint256 proofId, string memory datas) public virtual override {
        require(_proofTaskIf().exists(proofId), 
                "SCPNSVerifyTask: proof task token is nonexists");
        require(!_proofTaskIf().isInProofOfUseRightId(useRightId), 
                "SCPNSVerifyTask: useRight token is in proof");
        require(!SCPNSVerifyTask.isInVerifyOfUseRightId(useRightId), 
                "SCPNSVerifyTask: useRight token is in verify");

        //update old
        _updateVerifyState(useRightId);

        uint256 tokenId = _idGenerator.current();
        _mint(_stdIf(ContractProject.DNS_NAME_PROOFTASK).ownerOf(proofId), tokenId, NO_NAME, datas);

        _id2UseRightId[tokenId]     = useRightId;
        _useRightId2Id[useRightId]  = tokenId;

        uint256 parameterId = _useRightTokenIf().parameterIdOf(useRightId);
        uint256 sample      = _proofParameterIf().sampleOf(parameterId);
        VerifyParameter storage vp  = _id2VerifyParameter[tokenId];
        vp.startBlockNumber = block.number;
        vp.state            = VerifyState.Start;
        vp.proofId          = proofId;
        vp.tokenId          = tokenId;
        vp.stat.total       = sample;
        vp.q                = _create_q(useRightId, proofId);

        VerifyStat      storage vs  = _useRightId2VerifyStat[useRightId];
        vs.total            += sample;
    
        emit TaskData(_eventIndex.current(), useRightId, _preBlockNumber, _msgSender(), vp, datas);

        // next mint use 
        _preBlockNumber = block.number;
        _idGenerator.increment();
        _eventIndex.increment();
        _tokensSender[_msgSender()].add(tokenId);
    }

    function taskVerify(uint256 tokenId, bytes32 a, bytes32[] memory proof, bool[] memory pos) public virtual override whenNotPaused {

        require(_useRightTokenIf().exists(_id2UseRightId[tokenId]), 
                "SCPNSVerifyTask: useRight token is nonexists");
        require(SCPNSVerifyTask.isInVerifyOf(tokenId), 
                "SCPNSVerifyTask: token is not in verify(state != start or timeout)");
        require(_msgSender() == super.ownerOf(tokenId), 
                "SCPNSVerifyTask: must be owner of token");

        VerifyStat      storage vs = _useRightId2VerifyStat[_id2UseRightId[tokenId]];
        VerifyParameter storage vp = _id2VerifyParameter[tokenId];

        require(vp.q == a, 
                "SCPNSVerifyTask: the answer does not match  question question");

        vp.verifyBlockNumber       = block.number;
        vp.a                       = a;

        bool __valid = _is_valid_proof(tokenId, proof, pos);
        if (!__valid) {
            vs.failed  += 1;
            vp.stat.failed += 1;
        } else {
            vs.success += 1;
            vp.stat.success += 1;
        }

        _next_verify(tokenId, _id2UseRightId[tokenId]);
    }

    function updateWaitBlockNumber(uint256 newBlockNumber) public virtual override {
        require(hasRole(MANAGER_ROLE, _msgSender()), "SCPNSVerifyTask: must have manager role to update");
        _waitBlockNumber = newBlockNumber;
    }


    function _is_valid_proof(uint256 tokenId, bytes32[] memory proof, bool[] memory pos) internal view returns(bool) {
        VerifyParameter storage vp = _id2VerifyParameter[tokenId];
        uint256 proofId     = vp.proofId;
        bytes32 q           = vp.q;
        bytes32 merkleRoot  = _proofTaskIf().merkleRootOf(proofId);
        bool useSha256      = _proofTaskIf().useSha256Of(proofId);

        return _merkleProof(proof, pos, merkleRoot, q, useSha256);
    }

    function _merkleProof(bytes32[] memory proof, bool[] memory pos, bytes32 merkleRoot, bytes32 q, bool useSha256) internal pure returns(bool) {

        if (useSha256) {
            return MerkleProofUpgradeableSha256.verify(proof, pos, merkleRoot, q);
        }
        return MerkleProofUpgradeable.verify(proof, merkleRoot, q);
    }

    function eventCountOf() public view virtual override returns(uint256) {
        return _eventIndex.current();
    }

    function useRightIdOf(uint256 tokenId) public view virtual override returns(uint256) {
        return _id2UseRightId[tokenId];
    }

    function isInVerifyOf(uint256 tokenId) public view virtual override returns(bool) {
        return _isInVerifyOf(tokenId);
    }

    function isInVerifyOfUseRightId(uint256 tokenId) public view virtual override returns(bool) {
        return _exists(_useRightId2Id[tokenId]) && SCPNSVerifyTask.isInVerifyOf(_useRightId2Id[tokenId]);
    }

    function _isInVerifyOf(uint256 tokenId)  internal view returns(bool) {
        VerifyParameter storage vp = _id2VerifyParameter[tokenId];
        // we think verify task is verifing if state is Start Verify and residue verify > 0 and in verify times
        return (vp.state == VerifyState.Start || vp.state == VerifyState.Verify) 
            && SCPNSVerifyTask.residueVerifyOf(tokenId) > 0 
            && block.number < vp.startBlockNumber + _waitBlockNumber;
    }

    function proofParametersByUseRightId(uint256 tokenId) public view virtual override returns(
        bytes32 dynamicData, string memory parameter, uint256 proofId, bool has) {
        (dynamicData, parameter, proofId, has) = _proofTaskIf().latestParametersByUseRightId(tokenId);
    }

    function canVerifyOfUseRightId(uint256 tokenId) public view virtual override returns(bool) {
        (,,, bool has) = _proofTaskIf().latestParametersByUseRightId(tokenId);
        return has && !SCPNSVerifyTask.isInVerifyOfUseRightId(tokenId) && !_proofTaskIf().isInProofOfUseRightId(tokenId);
    }

    function hasVerifyTask(uint256 useRightId) public view virtual override returns(bool) {
        require(_useRightTokenIf().exists(useRightId), 
                "SCPNSVerifyTask: useRight is nonexist");

        return VerifyState.Start ==_id2VerifyParameter[_useRightId2Id[useRightId]].state || 
            VerifyState.Verify ==_id2VerifyParameter[_useRightId2Id[useRightId]].state ;
    }

    function residueVerifyOf(uint256 tokenId) public view virtual override returns(uint256) {
        VerifyParameter storage vp = _id2VerifyParameter[tokenId];
        return vp.stat.total - vp.stat.failed - vp.stat.success;
    }

    function verifyParameterOf(uint256 tokenId) public view virtual override returns(
        uint256 useRightId, bytes32 q, VerifyState state) {

        require(_exists(tokenId), 
                "SCPNSVerifyTask: token is nonexists");

        VerifyParameter storage vp = _id2VerifyParameter[tokenId];
        state       = vp.state;
        q           = vp.q;
        useRightId  = _id2UseRightId[tokenId];
    }

    function verifyParameterOfUseRightId(uint256 useRightId) public view virtual override returns(
        uint256 tokenId, bytes32 q, VerifyState state) {

        VerifyParameter storage vp = _id2VerifyParameter[_useRightId2Id[useRightId]];
        tokenId = vp.tokenId;
        state   = vp.state;
        q       = vp.q;
    }

    function verifyStatOfUseRightId(uint256 useRightId) public view virtual override returns(
        uint256 total, uint256 success, uint256 failed) {

        VerifyStat storage vs = _useRightId2VerifyStat[useRightId];
        total       = vs.total;
        success     = vs.success;
        failed      = vs.failed;
    }

    function verifyStatOf(uint256 tokenId) public view virtual override returns(
        uint256 total, uint256 success, uint256 failed) {

        VerifyParameter storage vp = _id2VerifyParameter[tokenId];
        total       = vp.stat.total;
        success     = vp.stat.success;
        failed      = vp.stat.failed;
    }

    function sha256Of(bytes memory data) public view virtual override returns(bytes32) {
       return sha256(abi.encodePacked(data));
    }

    function _updateVerifyState(uint256 useRightId) internal {
        uint256 tokenId = _useRightId2Id[useRightId];
    
        VerifyParameter storage vp = _id2VerifyParameter[tokenId];
        VerifyStat storage vs = _useRightId2VerifyStat[useRightId];
        if (vp.state == VerifyState.Start && block.number > vp.startBlockNumber + _waitBlockNumber) {
            vp.state = VerifyState.Error;
            vs.failed += 1;
        }
        if (vp.state == VerifyState.Verify && block.number > vp.startBlockNumber + _waitBlockNumber) {
            vp.state = VerifyState.Error;
        }
    }

    function _burn(uint256 tokenId) internal virtual override(SCPNSBase) {
        super._burn(tokenId);
        uint256 useRightId = _id2UseRightId[tokenId];
        delete _useRightId2Id[useRightId];
        delete _id2UseRightId[tokenId];
        delete _id2VerifyParameter[tokenId];

    }

    function _create_q(uint256 useRightId, uint256 proofId) internal view returns(bytes32) {
        (bytes32 dynamicData, ) = _proofTaskIf().parameterOf(proofId);
        bool useSha256      = _proofTaskIf().useSha256Of(proofId);
        uint256 parameterId = _useRightTokenIf().parameterIdOf(useRightId);
        uint256 leaf_count  = _proofParameterIf().leafCountOf(parameterId);
        uint256 leaf_deep   = _proofParameterIf().leafDeepOf(parameterId);
        uint256 sample      = _proofParameterIf().sampleOf(parameterId);

        uint256 sample_index = SCPNSVerifyTask.residueVerifyOf(_useRightId2Id[useRightId]) - 1;
        uint256 index  = SCPNSVerifyTask.randIndex(leaf_count, sample, sample_index);

        return SCPNSVerifyTask.createLeaf(dynamicData, index, leaf_deep, useSha256);
    }

    function _next_verify(uint256 tokenId, uint256 useRightId) internal {
        VerifyParameter storage vp  = _id2VerifyParameter[tokenId];
        if (vp.stat.total == vp.stat.success) {
            vp.state = VerifyState.End;
        }  else if (vp.stat.total <= (vp.stat.failed + vp.stat.success)) {
            vp.state = VerifyState.Error;
        } else if(vp.stat.total > (vp.stat.failed + vp.stat.success)) {
            vp.state            = VerifyState.Verify;
            vp.q                = _create_q(useRightId, vp.proofId);
        }

        emit TaskData(_eventIndex.current(), useRightId, _preBlockNumber, _msgSender(), vp, "{}");

        // next mint use 
        _preBlockNumber = block.number;
        _eventIndex.increment();
    }

    function randIndex(uint256 leafCount, uint256 sample, uint256 index) public view virtual override returns(uint256) {
        require(leafCount > sample, "SCPNSVerifyTask: sample value too large");
        require(sample > index, "SCPNSVerifyTask: index value too large");
        uint256 mod_value = (leafCount) / sample;
        uint256 base_value = mod_value * index;
        uint256 value =  base_value + (uint256(sha256(abi.encodePacked(block.timestamp * (index + 1), block.difficulty, msg.sender, blockhash(block.number), gasleft()))) % mod_value);
        return value >= leafCount ? leafCount -1 : value;
    }

    function createLeaf(bytes32 dynamicData, uint256 index, uint256 leaf_deep, bool useSha256) public view virtual override returns(bytes32) {
        bytes32 leaf = bytes32("");
        uint leaf_hash_count = 2;
        if (useSha256) {
            for(uint256 i = 0; i < leaf_deep + leaf_hash_count; i++) {
                leaf = i == 0 ? sha256(abi.encodePacked(dynamicData, index)): sha256(abi.encodePacked(leaf));
            }
        } else {
            for(uint256 i = 0; i < leaf_deep + leaf_hash_count; i++) {
                leaf = i == 0 ? keccak256(abi.encodePacked(dynamicData, index)): keccak256(abi.encodePacked(leaf));
            }
        }
        return leaf;
    }

    function isVerified(uint256 tokenId) public view virtual override returns(bool) {
        VerifyParameter storage vp  = _id2VerifyParameter[tokenId];
        return vp.state == VerifyState.End;
    }

    function isVerifyEnd(uint256 tokenId) public view virtual override returns(bool) {
        VerifyParameter storage vp  = _id2VerifyParameter[tokenId];
        return vp.state == VerifyState.End || vp.state == VerifyState.Failed || vp.state == VerifyState.Error;
    }
    //must be at end
    uint256[48] private __gap;
}

