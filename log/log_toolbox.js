let fs = require("fs");
let dateFormat = require('dateformat');

const INFO = "INFO";
const TOPIC = "TOPIC";
const ERROR = "ERROR";
const WARN = "WARN";

let config = require('./log_config.json');
let colors = require('./colors.json');

module.exports.logger = {

    Info: function (_module, env, message) {

        if (config.logLevel === "verbose") {
            let time = dateFormat(Date.now(), "yyyy-mm-dd h:MM:ss.l");
            let day = dateFormat(Date.now(), "yyyy-mm-dd");

            let _output_msg = "[" + time + "][" + INFO + "][" + _module + "]: ";
            let _file = config.single === "yes" ? config.logPath + config.filename + day + ".log" : config.logPath + config.filename + env + "-" + day + ".log";

            fs.appendFileSync(_file, _output_msg + message + "\n");
            if (config.logEco === "yes") {
                console.log('\x1b' + colors.green + '\x1b[0m', `${_output_msg}`, message);
            }
        }
    },
    Topic: function (_module, env, message) {

        let time = dateFormat(Date.now(), "yyyy-mm-dd h:MM:ss.l");
        let day = dateFormat(Date.now(), "yyyy-mm-dd");
        let _output_msg = "[" + time + "][" + TOPIC + "][" + _module + "]: ";
        let _file = config.single === "yes" ? config.logPath + config.filename + day + ".log" : config.logPath + config.filename + env + "-" + day + ".log";

        fs.appendFileSync(_file, _output_msg + message + "\n");
        if (config.logEco === "yes") {
            console.log('\x1b' + colors.bright.cyan + '\x1b[0m', `${_output_msg}`, message);
        }

    },
    Warning: function (_module, env, message) {

        let time = dateFormat(Date.now(), "yyyy-mm-dd h:MM:ss.l");
        let day = dateFormat(Date.now(), "yyyy-mm-dd");
        let _output_msg = "[" + time + "][" + WARN + "][" + _module + "]: ";
        let _file = config.single === "yes" ? config.logPath + config.filename + day + ".log" : config.logPath + config.filename + env + "-" + day + ".log";

        fs.appendFileSync(_file, _output_msg + message + "\n");
        if (config.logEco === "yes") {
            console.log('\x1b' + colors.bright.yellow + '\x1b[0m', `${_output_msg}`, message);
        }
    },
    Error: function (_module, env, message) {

        let time = dateFormat(Date.now(), "yyyy-mm-dd h:MM:ss.l");
        let day = dateFormat(Date.now(), "yyyy-mm-dd");
        let _output_msg = "[" + time + "][" + ERROR + "][" + _module + "]: ";
        let _file = config.single === "yes" ? config.logPath + config.filename + day + ".log" : config.logPath + config.filename + env + "-" + day + ".log";

        fs.appendFileSync(_file, _output_msg + message + "\n");
        if (config.logEco === "yes") {
            console.log('\x1b' + colors.bright.red + '\x1b[0m', `${_output_msg}`, message);
        }
    },
    log: {
        red: function (env, message,options) {

            let type_txt, _module_txt = "";

            if (env === undefined) {
                throw " \x1b[31m%s\x1b[0m Parameter \"env\" is required!"
            }
            if (options.type !== undefined) {
                type_txt = "[" + options.type + "]"
            }
            if (options._module !== undefined) {
                _module_txt = "[" + options._module + "]"
            }
            if (message === undefined) {
                throw " \x1b[31m%s\x1b[0m Parameter \"message\" is required!"
            } else {
                let time = dateFormat(Date.now(), "yyyy-mm-dd h:MM:ss.l");
                let day = dateFormat(Date.now(), "yyyy-mm-dd");
                let _output_msg = "[" + time + "]" + type_txt + _module_txt + ": ";
                let _file = config.single === "yes" ? config.logPath + config.filename + day + ".log" : config.logPath + config.filename + env + "-" + day + ".log";

                fs.appendFileSync(_file, _output_msg + message + "\n");
                if (config.logEco === "yes") {
                    console.log('\x1b' + colors.bright.red + '\x1b[0m', `${_output_msg}`, message);
                }
            }
        },
    }
}
