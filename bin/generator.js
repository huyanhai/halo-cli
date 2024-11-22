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
const inquirer_3 = require("./inquirer");
class Generator {
    constructor(name) {
        this.url = "";
        this.answers = {
            use: inquirer_3.UseType.DEFAULT,
            platform: inquirer_3.PlatformType.PC,
            language: inquirer_2.LanguageType.Vue,
        };
        this.name = name;
        this.init();
    }
    async init() {
        this.checkProjectName();
        await this.ask();
        this.url =
            this.answers.use === inquirer_3.UseType.MONOREPO
                ? constant_1.repositoryByMonorepo
                : this.answers.language === inquirer_2.LanguageType.React
                    ? constant_1.repositoryByReact
                    : constant_1.repositoryByVue;
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
    async downloadFn() {
        this.answers.way === inquirer_2.WayType.Project && this.writeFiles();
        (0, utils_1.downloadTemplate)(this.url, this.name, true, async () => {
            await this.editFilesInfo();
            // 非Monorepo模式下设置项目文件
            if (this.answers.way === inquirer_2.WayType.Project &&
                this.answers.use === inquirer_3.UseType.DEFAULT) {
                await this.moveFiles();
            }
            this.installDependence();
        });
    }
    // 写入模版文件
    async writeFiles() {
        const cachePath = (0, path_1.resolve)(process.cwd(), constant_1.cacheDirName);
        const filePath = (0, path_1.resolve)(process.cwd(), `${constant_1.cacheDirName}/package.json`);
        if ((0, fs_extra_1.existsSync)(cachePath)) {
            await (0, fs_extra_1.remove)(cachePath);
        }
        (0, utils_1.downloadTemplate)(constant_1.repositoryByMonorepoForVue, constant_1.cacheDirName, true, () => {
            const projectCtx = JSON.parse((0, fs_extra_1.readFileSync)(filePath, "utf-8"));
            projectCtx.name = `@${this.name}/${constant_1.templateName}`;
            (0, fs_extra_1.writeFileSync)(filePath, JSON.stringify(projectCtx, null, 4));
        });
    }
    // 移动模版文件
    async moveFiles() {
        const cachePath = (0, path_1.resolve)(process.cwd(), constant_1.cacheDirName);
        const projectRoot = (0, path_1.resolve)(constant_1.cwdDir, this.name, `packages/${constant_1.templateName}`);
        return (0, fs_extra_1.moveSync)(cachePath, projectRoot);
    }
    async editFilesInfo() {
        const projectRoot = (0, path_1.resolve)(constant_1.cwdDir, this.name);
        if (this.answers.use === inquirer_3.UseType.MONOREPO) {
            this.editTsconfig(projectRoot);
        }
        const projectCtx = JSON.parse((0, fs_extra_1.readFileSync)((0, path_1.resolve)(projectRoot, "package.json"), "utf-8"));
        const dependencies = this.answers.platform === inquirer_3.PlatformType.PC
            ? this.answers.language === inquirer_2.LanguageType.Vue
                ? ["ant-design-vue", "@ant-design/icons-vue"]
                : ["antd", "@ant-design/icons"]
            : this.answers.language === inquirer_2.LanguageType.Vue
                ? ["vant"]
                : ["@ant-design/mobile"];
        projectCtx.name = this.name;
        // 暂时不去写入项目依赖
        if (this.answers.way === inquirer_2.WayType.Project &&
            this.answers.use === inquirer_3.UseType.DEFAULT) {
            projectCtx["devDependencies"][`@${this.name}/${constant_1.templateName}`] =
                "workspace:^";
        }
        const spinner = (0, ora_1.default)("Writing Dependencies...");
        spinner.start();
        for (const item of dependencies) {
            const pkgVersion = await (0, latest_version_1.default)(item);
            projectCtx.dependencies[item] = `^${pkgVersion}`;
        }
        (0, fs_extra_1.writeFileSync)((0, path_1.resolve)(projectRoot, "package.json"), JSON.stringify(projectCtx, null, 4));
        spinner.stop();
    }
    async editTsconfig(projectRoot) {
        const configCtx = JSON.parse((0, fs_extra_1.readFileSync)((0, path_1.resolve)(projectRoot, "tsconfig.json"), "utf-8"));
        configCtx.compilerOptions.paths = {
            [`@${this.name}/*`]: ["packages/*"],
        };
        (0, fs_extra_1.writeFileSync)((0, path_1.resolve)(projectRoot, "tsconfig.json"), JSON.stringify(configCtx, null, 2));
    }
    // 安装项目依赖
    installDependence() {
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
