//SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";


interface IGPUToken is IERC721Enumerable {
    enum GPUType {
        A100,
        A800,
        H100,
        H800,
        RTX4090        
    }   // uint16

    event ChangeAdmin(address indexed from, address indexed to);
    event MintGPUTToken(address indexed to, uint256 tokenId, uint16 indexed GPUType);
    event RevokeGPUToken(address from, address to, uint256 tokenId);
    
    function changeAdmin(address newAdmin) external;

    function mint(address to, uint16 gpuType) external returns(uint256);

    function revoke(address from, address to, uint256 tokenId) external;

    function gpuTypeOf(uint256 tokenId) external view returns (uint16);
}
