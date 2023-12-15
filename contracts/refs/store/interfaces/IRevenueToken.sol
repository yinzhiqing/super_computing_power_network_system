//SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../ERC3525/interface/IERC3525SlotEnumerable.sol";


interface IRevenueToken is IERC3525SlotEnumerable {
    function mint(address to, uint256 slot_, uint256 value_) external payable returns(uint256);

    function getOwnerSize() external view returns (uint256);

    function getOwner(uint256 tokenId) external view returns (address);

    function getTotolSupplyValue() external view returns(uint256);

    //function getRevenuePerOwner() external view returns (address[], uint256[]);
}

// interface IVNETToken is IERC20 {
//     function mint(address to, uint256 slot_, uint256 value_);
// }
