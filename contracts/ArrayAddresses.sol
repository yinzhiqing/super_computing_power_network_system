// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

/**
* @title Mapping extension
* @author ZhiqingYin
* @dev Provides MappingExtend that can read key values
*
*
* Include with `using ArrayAddresses for ArrayAddresses.PairAddress;`
*
*/
library ArrayAddresses {
    struct PairAddress{
        address[] _values;
        // Mapping from value to index
        mapping(address => uint256) _valuesIndex;
        // Mapping from value to exists state
        mapping(address => bool) _valuesExists;
    }

    function valueOf(PairAddress storage pu, uint256 index) internal view returns(address) {
        require(pu._values.length > index, "ArrayAddresses: index is out of bounds");
        return pu._values[index];
    }

    function exists(PairAddress storage pu, address value) internal view returns(bool) {
        return pu._valuesExists[value];
    }

    function adds(PairAddress storage pu, address[] memory values) internal {
        require(values.length == values.length, "ArrayAddresses: values length is differ");
        uint256 len = values.length;
        for (uint256 i = 0; i < len; i++) {
            add(pu, values[i]);
        }
    }

    function add(PairAddress storage pu, address value) internal {
        if (!pu._valuesExists[value]) {
            uint256 index = pu._values.length;
            unchecked {
                pu._values.push(value);
                pu._valuesIndex[value] = index;
            }
        }
    }

    function remove(PairAddress storage pu, address value) internal {
        if (pu._valuesExists[value]) {
            uint256 curtindex = pu._valuesIndex[value];
            uint256 lastIndex = pu._values.length - 1;
            address lastIndexValue = pu._values[lastIndex];
            unchecked {
                if (curtindex != lastIndex) {
                    pu._values[curtindex] = pu._values[lastIndex];

                    pu._valuesIndex[lastIndexValue] = curtindex;
                }

                pu._values.pop();
                delete pu._valuesIndex[value];
                delete pu._valuesExists[value];
            }
        }
    }

    function cliean(PairAddress storage pu) internal {
        uint256 count = pu._values.length;
        while (count > 0) {
            count--;
            address value = pu._values[count];
            delete pu._valuesIndex[value];
            delete pu._valuesExists[value];
            pu._values.pop();
        }
    }

}
