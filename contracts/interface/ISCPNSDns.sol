
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface ISCPNSDns
{
    event Set(string indexed name, address addr, address manager);
    event Del(string indexed name, address addr, address manager);

    function pause() external;
    function unpause() external;
    function set(string memory name_, address add_) external;

    function name() external view returns(string memory);
    function symbol() external view returns(string memory);
    function addressOf(string memory name_) external view returns(address);
    function exists(string memory name_) external view returns(bool);
    function count() external view returns(uint256);
    function hostOf(uint256 index) external view returns(string memory, address);
}
