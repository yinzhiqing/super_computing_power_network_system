# !/bin/bash
    output_path='./output'
    java_path="./javas"
    class_path="vid.com"
    output_java_path="./javas"

	contract_list=$(sudo find ./output -name "*_output" -exec basename {} \;)
    arry=(${contract_list//_output/})
    for i in ${arry[@]}
    do
       echo " ~/.web3j/web3j generate solidity -a $output_path/contracts/"$i"_output/$i.abi -b $output_path/contracts/"$i"_output/$i.bin -o $output_java_path -p $class_path" 
       ~/.web3j/web3j generate solidity -a $output_path/contracts/"$i"_output/$i.abi -b $output_path/contracts/"$i"_output/$i.bin -o $output_java_path -p $class_path 
    done


