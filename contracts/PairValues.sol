// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

/**
* @title Mapping extension
* @author ZhiqingYin
* @dev Provides MappingExtend that can read key values
*
*
* Include with `using PairValues for PairValues.PairUint256;`
*
*/
library PairValues {
    struct PairUint256{
        uint256[] _keys;
        uint256[] _values;
        // Mapping from key to index
        mapping(uint256 => uint256) _keysIndex;
        // Mapping from key to exists state
        mapping(uint256 => bool) _keysExists;
    }

    function valueOfKeyByIndex(PairUint256 storage pu, uint256 index) internal view returns (uint256 key, uint256 value) {
        require(index < pu._keys.length, "PairValues: index out of bounds");
        key = pu._keys[index];
        value = pu._values[index];
        
    }

    function valueOf(PairUint256 storage pu, uint256 key) internal view returns(uint256) {
        require(pu._keysExists[key], "PairValues: key is out of bounds");
        uint256 index = pu._keysIndex[key];
        return pu._values[index];
    }

    function exists(PairUint256 storage pu, uint256 key) internal view returns(bool) {
        return pu._keysExists[key];
    }

    function sets(PairUint256 storage pu, uint256[] memory keys, uint256[] memory values) internal {
        require(keys.length == values.length, "PairValues: keys and values length is differ");
        uint256 len = keys.length;
        for (uint256 i = 0; i < len; i++) {
            set(pu, keys[i], values[i]);
        }
    }
    function set(PairUint256 storage pu, uint256 key, uint256 value) internal {
        if (pu._keysExists[key]) {
            uint256 curtIndex = pu._keysIndex[key];
            unchecked {
                pu._values[curtIndex] = value;
            }
        } else {
            uint256 index = pu._keys.length;
            unchecked {
                pu._keys.push(key);
                pu._values.push(key);
                pu._keysIndex[key] = index;
            }
        }
    }

    function remove(PairUint256 storage pu, uint256 key) internal {
        if (pu._keysExists[key]) {
            uint256 curtindex = pu._keysIndex[key];
            uint256 lastIndex = pu._keys.length - 1;
            uint256 lastIndexKey = pu._keys[lastIndex];
            unchecked {
                if (curtindex != lastIndex) {
                    pu._keys[curtindex]   = pu._keys[lastIndex];
                    pu._values[curtindex] = pu._values[lastIndex];

                    pu._keysIndex[lastIndexKey] = curtindex;
                }

                pu._keys.pop();
                pu._values.pop();
                delete pu._keysIndex[key];
                delete pu._keysExists[key];
            }
        }
    }

    function cliean(PairUint256 storage pu) internal {
        uint256 count = pu._keys.length;
        while (count > 0) {
            count--;
            uint256 key = pu._keys[count];
            delete pu._keysIndex[key];
            delete pu._keysExists[key];
        }
        delete pu._keys;
        delete pu._values;
    }

}
