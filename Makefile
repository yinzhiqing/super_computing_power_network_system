output=output
echo=off

# solc = 
ifneq ($(use_solc), true)
	HARDHAT=1
endif

#erc  erc20(e=20) erc721(e=721)
e = 20

all: main


ifndef HARDHAT
SRCS= $(wildcard ./contracts/*.sol) 
ifneq ($(fs), )
	SRCS = $(fs)
endif

SRCS_OBJS = $(patsubst %.sol, %_output, $(SRCS)) 

main: select clean build 

build: $(SRCS_OBJS)
define show_title
    @echo -n "--------------------------------------------------------"
	@echo -n $(1)
    @echo "--------------------------------------------------------"
endef

$(SRCS_OBJS):%_output : %.sol
	$(call show_title, $<)
	@solc  @openzeppelin=`pwd`/node_modules/@openzeppelin --optimize --overwrite --abi --bin -o $(output)/$@ $<
	@echo "output-->:"
	@ls $(output)/$@ 

select:
    ifneq ($(v), )
		@solc-select use $(v)
    endif

#v=0.8.0
install:
    ifneq ($(v), )
		@solc-select install $(v)
    endif

clean:
	@echo "clean ${output}"
	@rm -v -rf $(output)/*

else
#use npx hardhat

main: clean build 

init_node:
	nvm use v16.9.1

build:
	npx hardhat compile

clean:
	npx hardhat clean

endif

upgrade:
	npx hardhat run ./scripts/deploy_upgrade.js

deploy:
	npx hardhat run ./scripts/deploy_upgrade.js

show_contracts:
	npx hardhat run ./scripts/show_contract.js

define hardhat_run
	@npx hardhat run ./scripts/switchs/$(strip $1)/$(subst _.,.,$(subst __,_,$(strip $(2))_$(strip $(3))_$(strip $(4)).js))
endef

define show_conf
	@npx hardhat run ./scripts/switchs/$(strip $1)/show_confs.js
endef

define show_tokens
	@npx hardhat run ./scripts/switchs/$(strip $1)/show_tokens.js
endef

define run_script
	@npx hardhat run ./scripts/$(strip $1).js
endef


open: 
	$(call show_conf, "contracts")
	$(call hardhat_run , "contracts", open, $(target), $(index))
	$(call show_conf, "contracts")

close: 
	$(call show_conf, "contracts")
	$(call hardhat_run , "contracts", close, $(target), $(index))
	$(call show_conf, "contracts")

use: init_tokens_script
	$(call show_conf, "tokens")
	$(call hardhat_run, "tokens", open, $(target))
	$(call show_conf, "tokens")

unuse: init_tokens_script
	$(call show_conf, "tokens")
	$(call hardhat_run , "tokens", close, $(target))
	$(call show_conf, "tokens")

init_tokens_script:
	@npx hardhat run scripts/switchs/contracts/update_token_scripts.js

clean_tokens_script:
	@npx hardhat run scripts/switchs/contracts/clean_tokens_scripts.js

show_contracts_conf:
	$(call show_conf, "contracts")

show_contracts_conf_parsed:
	@npx hardhat run scripts/contracts_conf_parse.js

run_local_node:
	@npx hardhat node

run:
	$(call run_script, $(md))

indexs:
	$(call show_tokens, "contracts")

accounts:
	@npx hardhat run scripts/accounts.js

make_md:
	@npx hardhat run scripts/make_jsons_docs.js

export_java:
	@~/.web3j/web3j generate solidity -a $output_path/contracts/"$n"_output/$c.abi -b $output_path/contracts/"$c"_output/$c.bin -o $output_java_path -p $class_path 

init_dns:
	$(call run_script, "init_dns")

init_contracts:
	$(call run_script, "init_contracts")

init_parameters:
	$(call run_script, "init_parameters")

init_type_revenue:
	$(call run_script, "init_type_revenue")

grantrole:
	$(call run_script, "grantrole")

show_dns:
	$(call run_script, "show_dnss")

show_gpus:
	$(call run_script, "show_gpus")

show_types:
	$(call run_script, "show_type_units")

show_comp_units:
	$(call run_script, "show_comp_units")

show_comp_vms:
	$(call run_script, "show_comp_vms")

show_use_rights:
	$(call run_script, "show_use_rights")

show_proof_tasks:
	$(call run_script, "show_proof_tasks")

show_proof_parameters:
	$(call run_script, "show_proof_parameters")

show_verify_tasks:
	$(call run_script, "show_verify_tasks")

show_comp_ranks:
	$(call run_script, "show_comp_ranks")

show_comp_ranks_history:
	$(call run_script, "show_comp_ranks_history")

show_comp_ranks_target:
	$(call run_script, "show_comp_ranks_target")

mint_gpu:
	$(call run_script, "mint_gpu")

mint_proof_parameter:
	$(call run_script, "mint_proof_parameter")

mint_type_unit:
	$(call run_script, "mint_type_unit")

mint_type_revenue:
	$(call run_script, "mint_type_revenue")

mint_comp_unit:
	$(call run_script, "mint_comp_unit")

mint_comp_vm:
	$(call run_script, "mint_comp_vm")

mint_use_right:
	$(call run_script, "mint_use_right")

mint_proof_task:
	$(call run_script, "mint_proof_task")

mint_proof_task_sdaemon:
	$(call run_script, "mint_proof_task_sdaemon")

end_proof_task:
	$(call run_script, "end_proof_tasks")

mint_verify_task:
	$(call run_script, "mint_verify_task")

end_verify_task:
	$(call run_script, "end_verify_tasks")

mint_verify_task_target:
	$(call run_script, "mint_verify_task_target")

cancel_proof_tasks:
	$(call run_script, "cancel_proof_tasks")

put_market_use:
	$(call run_script, "put_market_use")

buyer_put_market_use:
	$(call run_script, "buyer_put_market_use")

buy_market_use:
	$(call run_script, "buy_market_use")

revoke_market_use:
	$(call run_script, "revoke_market_use")

put_market_revenue:
	$(call run_script, "put_market_revenue")

buyer_put_market_revenue:
	$(call run_script, "buyer_put_market_revenue")

buy_market_revenue:
	$(call run_script, "buy_market_revenue")

revoke_market_revenue:
	$(call run_script, "revoke_market_revenue")

show_market_use:
	$(call run_script, "show_market_use")

show_market_revenue:
	$(call run_script, "show_market_revenue")

show_balances:
	$(call run_script, "show_balances")

show_revenues:
	$(call run_script, "show_revenues")

show_type_revenues:
	$(call run_script, "show_type_revenues")

show_market_orders_use:
	$(call run_script, "show_market_orders_use")

show_market_orders_revenue:
	$(call run_script, "show_market_orders_revenue")

show_use_rights_market:
	$(call run_script, "show_use_rights_market")

show_distribute:
	$(call run_script, "show_distribute")


tests:
	@npx hardhat run scripts/test.js

init_all: init_dns init_contracts mint_gpu mint_type_unit mint_proof_parameter init_parameters

help:
	@npx hardhat run scripts/helps.js

.PHONY: select build clean deploy init show_contracts show_contracts_conf open close use unuse  tests
