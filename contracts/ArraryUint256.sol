// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

/**
* @title Mapping extension
* @author ZhiqingYin
* @dev Provides MappingExtend that can read key values
*
*
* Include with `using Arrayuint256es for Arrayuint256es.Uint256;`
*
*/
library ArrayUnit256 {
    struct Uint256s {
        uint256[] _values;
        // Mapping from value to index
        mapping(uint256 => uint256) _valuesIndex;
        // Mapping from value to exists state
        mapping(uint256 => bool) _valuesExists;
    }

    function length(Uint256s storage pu) internal view returns(uint256) {
        return pu._values.length;
    }

    function valuesOf(Uint256s storage pu) internal view returns(uint256[] memory) {
        return pu._values;
    }

    function valueOf(Uint256s storage pu, uint256 index) internal view returns(uint256) {
        require(pu._values.length > index, "ArrayUint256: index is out of bounds");
        return pu._values[index];
    }

    function exists(Uint256s storage pu, uint256 value) internal view returns(bool) {
        return pu._valuesExists[value];
    }

    function adds(Uint256s storage pu, uint256[] memory values) internal {
        require(values.length == values.length, "ArrayUint256: values length is differ");
        uint256 len = values.length;
        for (uint256 i = 0; i < len; i++) {
            add(pu, values[i]);
        }
    }
    function add(Uint256s storage pu, uint256 value) internal {
        if (!pu._valuesExists[value]) {
            uint256 index = pu._values.length;
            unchecked {
                pu._values.push(value);
                pu._valuesIndex[value]  = index;
                pu._valuesExists[value] = true;
            }
        }
    }

    function remove(Uint256s storage pu, uint256 value) internal {
        if (pu._valuesExists[value]) {
            uint256 curtindex = pu._valuesIndex[value];
            uint256 lastIndex = pu._values.length - 1;
            uint256 lastIndexValue = pu._values[lastIndex];
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

    function cliean(Uint256s storage pu) internal {
        uint256 count = pu._values.length;
        while (count > 0) {
            count--;

            uint256 value = pu._values[count];
            delete pu._valuesIndex[value];
            delete pu._valuesExists[value];

            pu._values.pop();
        }
    }

}
