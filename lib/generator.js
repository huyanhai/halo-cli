"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Generator = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const process_1 = require("process");
const fs_extra_1 = require("fs-extra");
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
const log_symbols_1 = __importDefault(require("log-symbols"));
const latest_version_1 = __importDefault(require("latest-version"));
const ora_1 = __importDefault(require("ora"));
const utils_1 = require("./utils");
const inquirer_2 = require("./inquirer");
const constant_1 = require("./constant");
const path_1 = require("path");
class Generator {
    constructor(name) {
        this.url = "";
        this.answers = { use: "", platform: "" };
        this.name = name;
        this.init();
    }
    async init() {
        this.checkProjectName();
        await this.ask();
        this.url = this.answers.use === "monorepo" ? constant_1.repositoryByMonorepo : constant_1.repositoryByVue;
        this.downloadFn();
    }
    checkProjectName() {
        const projectName = (0, validate_npm_package_name_1.default)(this.name);
        if (!projectName.validForNewPackages) {
            console.error(chalk_1.default.red(`Invalid project name: "${this.name}"`));
            projectName.errors &&
                projectName.errors.forEach((err) => {
                    console.error(chalk_1.default.red.dim("Error: " + err));
                });
            projectName.warnings &&
                projectName.warnings.forEach((warn) => {
                    console.error(chalk_1.default.red.dim("Warning: " + warn));
                });
            (0, process_1.exit)(1);
        }
    }
    async ask() {
        await this.checkTargetDir();
        this.answers = await inquirer_1.default.prompt(inquirer_2.prompts);
    }
    // 检查目录是否存在
    async checkTargetDir() {
        if ((0, fs_extra_1.existsSync)(this.name)) {
            const { action } = await inquirer_1.default.prompt([
                {
                    name: "action",
                    type: "list",
                    message: `${chalk_1.default.cyan(process.cwd() + "/" + this.name)} already exists, please select the action:`,
                    choices: [
                        { name: "Overwrite", value: "overwrite" },
                        { name: "Cancel", value: false },
                    ],
                },
            ]);
            if (!action) {
                (0, process_1.exit)(0);
            }
            if (action === "overwrite") {
                console.log(`🗑 ${chalk_1.default.cyan(`The ${process.cwd()}/${this.name} directory is being deleted ...`)}`);
                await (0, fs_extra_1.remove)(this.name);
                (0, utils_1.cleanConsole)();
            }
        }
    }
    downloadFn() {
        (0, utils_1.downloadTemplate)(this.url, this.name, true, async () => {
            await this.editFilesInfo();
            this.installDependence();
        });
    }
    async editFilesInfo() {
        const projectRoot = (0, path_1.resolve)(constant_1.cwdDir, this.name);
        const projectCtx = JSON.parse((0, fs_extra_1.readFileSync)((0, path_1.resolve)(projectRoot, "package.json"), "utf-8"));
        const dependences = this.answers.platform === "pc" ? ["ant-design-vue", "@ant-design/icons-vue"] : ["vant"];
        projectCtx.name = this.name;
        const spinner = (0, ora_1.default)("Writing Dependences...");
        spinner.start();
        for (const item of dependences) {
            const pkgVersion = await (0, latest_version_1.default)(item);
            projectCtx.dependencies[item] = `^${pkgVersion}`;
        }
        (0, fs_extra_1.writeFileSync)((0, path_1.resolve)(projectRoot, "package.json"), JSON.stringify(projectCtx, null, 4));
        spinner.stop();
    }
    installDependence() {
        // 安装项目依赖
        (0, utils_1.install)({ cwd: `./${this.name}`, tool: "pnpm" })
            .then(() => {
            console.log(log_symbols_1.default.success, chalk_1.default.green("🎉 Generate Success"));
        })
            .catch((err) => {
            console.log("err", err);
        });
    }
}
exports.Generator = Generator;
