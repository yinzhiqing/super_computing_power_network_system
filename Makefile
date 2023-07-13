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

mint:
	$(call run_script, "mint")

grantrole:
	$(call run_script, "grantrole")

append_type:
	$(call run_script, "append_type")

show_types:
	$(call run_script, "show_types")

show_tokens:
	$(call run_script, "show_tokens")

tests:
	@npx hardhat run scripts/test.js

help:
	@npx hardhat run scripts/helps.js

.PHONY: select build clean deploy init show_contracts show_contracts_conf open close use unuse  tests
