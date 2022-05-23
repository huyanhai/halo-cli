"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.install = exports.downloadTemplate = exports.cleanConsole = void 0;
const readline_1 = __importDefault(require("readline"));
const ora_1 = __importDefault(require("ora"));
const download_git_repo_1 = __importDefault(require("download-git-repo"));
const log_symbols_1 = __importDefault(require("log-symbols"));
const process_1 = require("process");
const cross_spawn_1 = __importDefault(require("cross-spawn"));
const chalk_1 = __importDefault(require("chalk"));
const which_1 = __importDefault(require("which"));
/**
 * 清除控制台内容
 */
const cleanConsole = () => {
    readline_1.default.cursorTo(process.stdout, 0, 0);
    readline_1.default.clearScreenDown(process.stdout);
};
exports.cleanConsole = cleanConsole;
/**
 * 下载模板
 * @param url
 * @param pathName
 * @param clone
 * @param cb
 */
const downloadTemplate = async (url, pathName, clone = false, cb) => {
    const spinner = (0, ora_1.default)("Downloading ...");
    spinner.start();
    (0, download_git_repo_1.default)(url, pathName, { clone: clone }, async (err) => {
        spinner.stop();
        if (err) {
            console.log(log_symbols_1.default.error, chalk_1.default.red(`Download Failed: ${err}`));
            (0, process_1.exit)(1);
        }
        else {
            cb && cb();
        }
    });
};
exports.downloadTemplate = downloadTemplate;
const install = (option) => {
    const cwd = option.cwd;
    return new Promise((resolve, reject) => {
        const command = option.tool;
        const args = ["install"];
        try {
            which_1.default.sync(command);
        }
        catch (error) {
            throw new Error(chalk_1.default.red(`${command} not install`));
        }
        const child = (0, cross_spawn_1.default)(command, args, { cwd, stdio: "inherit" });
        child.once("close", (code) => {
            if (code !== 0) {
                return reject({
                    command: `${command} ${args.join(" ")}`,
                });
            }
            resolve({
                command: true,
            });
        });
        child.once("error", reject);
    });
};
exports.install = install;
