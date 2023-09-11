// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import  "./ISCPNSBase.sol";

interface ISCPNSVerifyTask is 
    ISCPNSBase
{

    enum VerifyState {None, Start, End, Error}
    struct VerifyParameter {
        uint256 taskId;
        bytes32 q;
        uint256 a;
        uint256 sa;
        uint256 startBlockNumber;
        uint256 endBlockNumber;
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
    function mint(uint256 tokenId, bytes32 q, string memory datas) external;

    function isInVerifyOf(uint256 tokenId) external view returns(bool);
    function isInVerifyOfUseRightId(uint256 tokenId) external view returns(bool);
}
