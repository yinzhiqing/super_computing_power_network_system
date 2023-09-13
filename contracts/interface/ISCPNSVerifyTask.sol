// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSVerifyTask is 
    ISCPNSBase
{

    enum VerifyState {None, Start, Verify, End, Error}
    struct VerifyParameter {
        uint256 tokenId;
        uint256 proofId;
        bytes32 q;
        uint256 a;
        uint256 sa;
        uint256 startBlockNumber;
        uint256 verifyBlockNumber;
        uint256 endBlockNumber;
        bytes32[] proof;
        address sender;
        VerifyState state;
    }

    struct VerifyStat {
        uint256 total;
        uint256 succees;
        uint256 failed;
    }


    event TaskData(uint256 indexed index, uint256 indexed useRightId, 
                   uint256 preBlockNumber,  address sender, VerifyParameter vp, string datas);
    function mint(uint256 useRightId, uint256 proofId, bytes32 q, string memory datas) external;
    function taskVerify(uint256 tokenId, uint256 a, bytes32[] memory proof) external;
    function taskEnd(uint256 tokenId, uint256 sa) external;

    function canVerifyOfUseRightId(uint256 tokenId) external view returns(bool);
    function proofParametersByUseRightId(uint256 tokenId) external view returns(
        bytes32 dynamicData, string memory parameter, uint256 proofId, bool has);

    function hasVerifyTask(uint256 useRightId)  external view returns(bool); 
    function VerifyParameterOf(uint256 useRightId) external view returns(
        uint256 tokenId, bytes32 q, VerifyState state);
    function useRightIdOf(uint256 tokenId) external view returns(uint256);
    function isInVerifyOf(uint256 tokenId) external view returns(bool);
    function isInVerifyOfUseRightId(uint256 tokenId) external view returns(bool);
    function eventCountOf() external view returns(uint256);
}
