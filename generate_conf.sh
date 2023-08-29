# !/bin/bash
    contracts_path='./contracts'
    skip_path='interface'
    output_path="./jsons/contracts"
    output_file="$output_path/contract_templete.json"
    split_section=""

	contract_list=$(sudo find $contracts_path -maxdepth 1 -type f -name "*.sol" -exec basename {} \;)
    arry=(${contract_list//.sol/})
    echo "{" > $output_file
    for name in ${arry[@]}
    do
        echo -e "\t$split_section" >> $output_file
        echo -e "\t\"$name\": {" >> $output_file
        echo -e "\t\t\"name\": \"$name\"," >> $output_file
        echo -e "\t\t\"address\": \"\"," >> $output_file
        echo -e "\t\t\"deploy\": false," >> $output_file
        echo -e "\t\t\"upgrade\": false," >> $output_file
        echo -e "\t\t\"fixed\": false," >> $output_file
        echo -e "\t\t\"params\": []" >> $output_file
        echo -e "\t}" >> $output_file
        split_section=","
    done
    echo "}" >> $output_file


