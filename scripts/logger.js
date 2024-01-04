const prj           = require("../prj.config.js");
const util          = require('util');
const debug_model   = prj.debug;
function date_format(dash = "-", colon = ":", space = " ") {
    function pad(n) {return n < 10 ? "0" + n : n}
    function _date(p, split, val ) { return p.length > 0 ? p + split + pad(val): "" + pad(val)}
    d = new Date();
    var ret = _date("", dash, d.getFullYear());
    ret = _date(ret, dash, d.getMonth() + 1);
    ret = _date(ret, dash, d.getDate());
    ret = _date(ret, space, d.getHours());
    ret = _date(ret, colon, d.getMinutes());
    ret = _date(ret, colon, d.getSeconds());
    return ret;
}

function create_split_symbol(weight = 80, symbol = "-", end_symbol = ":") {
    var line = "";
    line += symbol.repeat(weight);
    line += end_symbol;
    return line;
}

function clear() {
    console.clear();
}
function add_color(msg, color) {
    tcolor = styles[color];
    return tcolor[0] + msg + tcolor[1];
}

function error(msg, title = "", kwargs = {}) {
    if(kwargs == undefined) {
        kwargs          = {"type":"log", "color":"red"};
    } else {
        kwargs["type"]  = get_kwargs(kwargs, "type", "log");
        kwargs["color"] = get_kwargs(kwargs, "color", "red");
    }
    show_msg(msg, title, kwargs);
}

function get_kwargs(kwargs, name, defvalue = "") {
    if (kwargs == undefined || kwargs[name] == undefined) {
        return defvalue;
    } else {
        return kwargs[name];
    }
}

function __merge_kwargs(kwargs, defkwargs) {
    if(kwargs == undefined) {
        kwargs = defkwargs;
    } else {
        for(key in defkwargs) {
            kwargs[key] = get_kwargs(kwargs, key, defkwargs[key]);
        }
    }
    return kwargs;
}
function warning(msg, title = "", kwargs = {}) {
    kwargs = __merge_kwargs(kwargs, {"type":"log", "color":"yellow"});
    show_msg(msg, title, kwargs);
}

function debug(msg, title = "", kwargs = {}) {
    if (debug_model == true || debug_model == "true") 
    {
        kwargs = __merge_kwargs(kwargs, {"type":"log"});
        show_msg(msg, title, kwargs);
    }
}

function info(msg, title = "", kwargs = {}) {
    kwargs = __merge_kwargs(kwargs, {"type":"log", "color":"blue"});
    show_msg(msg, title, kwargs);
}

function table(msg, title = "", kwargs = {}) {
    kwargs = __merge_kwargs(kwargs, {"format":false, "type":"table"});
    show_msg(msg, title, kwargs);
}

function lines(msg, title = "", kwargs = {}) {
    kwargs = __merge_kwargs(kwargs, {"format":false, "type":"lines"});
    show_msg(msg, title, kwargs);
}

function log(msg) {
    console.log(msg);
}

function form_frame(count = 100) {
    console.log("=".repeat(count));
}

function form_split(count = 100) {
    console.log("-".repeat(count));
}
function form_title(title, kwargs = {}) {
    form_frame();
    kwargs = __merge_kwargs(kwargs, {"format":false, "type":"log", "color" : "yellow"});
    show_msg("\t\t\t\t\t--" + title + "--", "", kwargs);
    form_frame();
}
function form_info(info, max) {
    for(let k in info){
        //计算需要补充的'\t'个数
        let tcount = Math.ceil((max - str_show_len(k)) / 8);
        let tables = "";
        for(let i = 0; i < tcount; i++) {
            tables += "\t";
        }

        print(k);
        print(tables);
        print(info[k].toString());
        print("\n");
        //process.stdout.write(k);
        //process.stdout.write(tables);
        //process.stdout.write(info[k].toString());
        //process.stdout.write("\n");
    }
}

function print(...msgs) {
    for(let i in msgs) {
        process.stdout.write(msgs[i]);
    }
}

function form(title, ...infos) {
    form_title(title);

    let max = 0;
    //获取shell显示时字节最大长度: 中文有特殊字符 /[\u4e00-\u9fa5]/ 不应算在显示内容中
    for (let j in infos) {
        let info = infos[j];
        for(let k in info){
            let length = str_show_len(k);
            max = max < length ? length : max;
        }
    }

    //将字符串换算成\t后长度（值最左边位置）
    //// \t 在命令行中长度为8
    const tab_len = 8;
    //// key 与 value间隔/t
    const space_len = 1
    max = (Math.ceil(max / tab_len)) * tab_len + (tab_len * space_len)  ;

    for (let i in infos) {
        form_info(infos[i], max);
        i < infos.length - 1 ?  form_split() : "" ;
    }
    form_frame();
}

function str_show_len(data) {
    let reg = /[\u4e00-\u9fa5]/;
    let len = 0;
    Array.from(data).forEach(function(v){len += reg.test(v) ? 2 : 1});
    return len;
}
function show_msg(msg, title = "", kwargs = {}) {
    type        = get_kwargs(kwargs, "type", "log");
    title_color = get_kwargs(kwargs, "title_color", "red");
    color       = get_kwargs(kwargs, "color", "");
    format      = get_kwargs(kwargs, "format", true);

    if (title.length > 0) {
        console.log(create_split_symbol() + add_color(title, title_color));
    }

    if (type == "table" || type == "t") {
        console.table(msg);
    } else if (type == "json") {
        msg = JSON.stringify(msg, null, 4);
        console.log(msg);
    } else {
        if (format) {
            msg = JSON.stringify(msg);
            if (msg.length > 0) msg = date_format() + ": " + add_color(msg, color);
        } else {
            msg = add_color(msg, color);
        }
        console.log(msg);
    }
}

const styles = {
    '': ['', ''],
    'bold': ['\x1B[1m', '\x1B[22m'],
    'italic': ['\x1B[3m', '\x1B[23m'],
    'underline': ['\x1B[4m', '\x1B[24m'],
    'inverse': ['\x1B[7m', '\x1B[27m'],
    'strikethrough': ['\x1B[9m', '\x1B[29m'],
    'white': ['\x1B[37m', '\x1B[39m'],
    'grey': ['\x1B[90m', '\x1B[39m'],
    'black': ['\x1B[30m', '\x1B[39m'],
    'blue': ['\x1B[34m', '\x1B[39m'],
    'cyan': ['\x1B[36m', '\x1B[39m'],
    'green': ['\x1B[32m', '\x1B[39m'],
    'magenta': ['\x1B[35m', '\x1B[39m'],
    'red': ['\x1B[31m', '\x1B[39m'],
    'yellow': ['\x1B[33m', '\x1B[39m'],
    'whiteBG': ['\x1B[47m', '\x1B[49m'],
    'greyBG': ['\x1B[49;5;8m', '\x1B[49m'],
    'blackBG': ['\x1B[40m', '\x1B[49m'],
    'blueBG': ['\x1B[44m', '\x1B[49m'],
    'cyanBG': ['\x1B[46m', '\x1B[49m'],
    'greenBG': ['\x1B[42m', '\x1B[49m'],
    'magentaBG': ['\x1B[45m', '\x1B[49m'],
    'redBG': ['\x1B[41m', '\x1B[49m'],
    'yellowBG': ['\x1B[43m', '\x1B[49m']
};

module.exports = {
    date_format,
    show_msg,
    info,
    debug,
    warning,
    error,
    table,
    lines,
    clear,
    log,
    form,
    str_show_len,
}
