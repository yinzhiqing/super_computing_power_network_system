const path  = require("path");
const fs    = require("fs");
const utils = require("../../utils")
const logger= require("../../logger")

pathname = path.join(__dirname, "./");
const files         = utils.get_files(pathname)
const startswith    = ["close_", "open_"]
const excludes      = ["close_all.js"]
for (let i = 0; i < files.length; i++) {
    let found = false;
    for(let j = 0; j < excludes.length; j++) {
        if (files[i] == excludes[j]) {
            found = true;
            break;
        }
    }

    if (found) continue;

    for(let j = 0; j < startswith.length; j++) {
        if (files[i].lastIndexOf(startswith[j]) == 0) {
            logger.debug("remove " + path.join(__dirname, files[i]));
            fs.unlinkSync(path.join(__dirname, files[i]));
            break;
        }
    }
}


