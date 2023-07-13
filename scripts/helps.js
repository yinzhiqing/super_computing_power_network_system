const logger = require("./logger");
const switchs = require("./switchs/contracts/deploy_upgrade_swith.js");
const tokens = switchs.token_names();
args = [
    {
        "name":     "help",
        "value":    "",
        "desc":     "show this help",
        "premise":  ""
    },
    {
        "name":     "use_solc",
        "value":    "true(default) | false.",
        "desc":     "build use solc or hardhat, use_solc=true: use solc; use_solc=false: use hardhat",
        "premise":  "",
    },
    {
        "name":     "select",
        "value":    "v=0.8.0",
        "desc":     "select solc version, v=[0.6.0 | 0.8.0 | ...]",
        "premise":  "use_solc=true",
    },
    {
        "name":     "install",
        "value":    "v=0.8.0",
        "desc":     "install solc with version, v=[0.6.0 | 0.8.0 | ...]",
        "premise":  "use_solc=true",
    },
    {
        "name":     "clean",
        "value":    "",
        "desc":     "clean build result",
        "premise":  "",
    },
    {
        "name":     "build",
        "value":    "",
        "desc":     "build contracts",
        "premise":  "",
    },
    {
        "name":     "deploy",
        "value":    "",
        "desc":     "deploy contracts with jsons/contracts/contract_NETWORK.json",
        "premise":  "",
    },
    {
        "name":     "upgrade",
        "value":    "",
        "desc":     "upgrade contracts with jsons/contracts/contract_NETWORK.json",
        "premise":  "",
    },
    {
        "name":     "init",
        "value":    "",
        "desc":     "init prj contract with jsons/contracts/contract_NETWORK.json",
        "premise":  "",
    },
    {
        "name":     "open",
        "value":    "target=[deploy | upgrade] index=["+ tokens + "]",
        "desc":     "make prj contract can deploy. open switchs in jsons/contracts/contract_NETWORK.json",
        "premise":  "",
    },
    {
        "name":     "close",
        "value":    "[target=[deploy | upgrade]] index=[" + tokens + "]",
        "desc":     "make prj contract can't deploy. open switchs in jsons/contracts/contract_NETWORK.json",
        "premise":  "",
    },
    {
        "name":     "show_contracts_conf",
        "value":    "",
        "desc":     "show prj contracts info .show jsons/contracts/contract_NETWORK.json info",
        "premise":  "",
    },
    {
        "name":     "show_contracts",
        "value":    "",
        "desc":     "show contracts info in blockchain(chain = hardhat.conf.js:defaultNetwork)",
        "premise":  "hardhat.conf.js:defaultNetwork",
    },
]
name_kwargs     = {"format": false}
value_kwargs    = {"format": false, "color": "yellow"}
desc_kwargs     = {"format": false, "color": ""}
premise_kwargs  = {"format": false, "color": "red"}
alig = "\t\t";

logger.show_msg("Usage: make OPTION ARGS");
for (let i = 0; i < args.length; i++) {
    logger.show_msg(args[i].name,  "", name_kwargs);
    if (args[i].value)      logger.show_msg(alig + "value:\t"    + args[i].value,    "", value_kwargs);
    if (args[i].desc)       logger.show_msg(alig + args[i].desc,                     "", desc_kwargs);
    if (args[i].premise)    logger.show_msg(alig + "premise:\t"  +  args[i].premise, "", premise_kwargs);
}

