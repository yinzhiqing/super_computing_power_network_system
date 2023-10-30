// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSVerifyTask is 
    ISCPNSBase
{
    struct VerifyStat {
        uint256 total;
        uint256 succees;
        uint256 failed;
    }

    enum VerifyState {None, Start, Verify, End, Failed, Error}
    struct VerifyParameter {
        uint256 tokenId;
        uint256 proofId;
        uint256 startBlockNumber;
        uint256 verifyBlockNumber;
        uint256 endBlockNumber;
        address sender;
        VerifyState state;
        bytes32 q;
        bytes32 a;
        VerifyStat stat;
    }
    event TaskData(uint256 indexed index, uint256 indexed useRightId, 
                   uint256 preBlockNumber,  address sender, VerifyParameter vp, string datas);

    function mint(uint256 useRightId, uint256 proofId, string memory datas) external;
    function taskVerify(uint256 tokenId, bytes32 a, bytes32[] memory proof, bool[] memory pos) external;
    function updateWaitBlockNumber(uint256 newBlockNumber) external;

    function canVerifyOfUseRightId(uint256 tokenId) external view returns(bool);
    function proofParametersByUseRightId(uint256 tokenId) external view returns(
        bytes32 dynamicData, string memory parameter, uint256 proofId, bool has);

    function hasVerifyTask(uint256 useRightId)  external view returns(bool); 
    function residueVerifyOf(uint256 tokenId) external view returns(uint256);
    function verifyParameterOfUseRightId(uint256 useRightId) external view returns(
        uint256 tokenId, bytes32 q, VerifyState state);
    function verifyParameterOf(uint256 tokenId) external view returns(
        uint256 useRightId, bytes32 q, VerifyState state);
    function verifyStatOfUseRightId(uint256 useRightId) external view returns(
        uint256 total, uint256 succees, uint256 failed);
    function useRightIdOf(uint256 tokenId) external view returns(uint256);
    function isInVerifyOf(uint256 tokenId) external view returns(bool);
    function isInVerifyOfUseRightId(uint256 tokenId) external view returns(bool);
    function eventCountOf() external view returns(uint256);
    function sha256Of(bytes memory data) external view returns(bytes32);

    //------------------test---------------
    function randIndex(uint256 leafCount) external view returns(uint256);
    function createLeaf(bytes32 dynamicData, uint256 index, uint256 leaf_deep, bool useSha256) external view returns(bytes32);
}
