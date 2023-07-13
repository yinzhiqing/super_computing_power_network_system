const logger    = require("./logger");

function new_markdown(name) {
    return {
        name : name,
        level: 1,
        lines: [],
        append_h: function(level, text) {
            let line = "";
            let i = 0;
            while (i < level) {
                line += "#";
                i++;
            }
            this.level = level;
            this.lines.push(line + " " + text);
            return this;
        },
        
        append_h1: function(text) {
            return this.append_h(1, text);
        },
        
        append_h2: function(text) {
            return this.append_h(2, text);
        },
        
        append_h3: function(text) {
            return this.append_h(3, text);
        },
        
        append_h4: function(text) {
            return this.append_h(4, text);
        },
        
        append_h5: function(text) {
            return this.append_h(5, text);
        },
        
        append_line: function(text) {
            this.lines.push(text);
            return this;
        },
        
        append_empty_line: function() {
            return this.append_line("");
        },

        append_map_list: function(datas) {
            let deep = 0;
            let cache = {};
            let keys = [];
            for (let i = 0; i < datas.length; i++) {
                let data = datas[i]
                for (let key in data) {
                    if (keys.indexOf(key) < 0) keys.push(key);
                    if( cache[key] == undefined) { cache[key] = new Map(); }
        
                    cache[key][i] = data[key];
                }
            }
        
            this.append_line(keys.join("|"));
            this.append_line((new Array(keys.length)).join("---|") + "---");
            
            for (let i = 0; i < datas.length; i++) {
                let line = new Array(keys.length);
                for (let j in keys) {
                    let key = keys[j];
                    if (cache[key] != undefined && cache[key][i] != undefined) {
                        line[j] = cache[key][i];
                    }
                }
                this.append_line(line.join("|"));
            }
            return this;
        },
        
        text: function() {
            return this.lines.join("\r\n");
        },
        
    }
}
        
module.exports = {
    new_markdown,
}
