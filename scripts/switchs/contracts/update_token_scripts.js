const switchs = require("./deploy_upgrade_swith.js");

types = ["deploy", "upgrade"];

token_names = switchs.token_names();
for(idx in types) {
    for (let i = 0; i < token_names.length; i++) {
        switchs.create_token_script(token_names[i], types[idx]);
        switchs.create_token_script(token_names[i], types[idx]);
    }
    switchs.create_tokens_script(types[idx]);
}
