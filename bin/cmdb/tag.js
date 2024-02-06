"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const dayjs_1 = __importDefault(require("dayjs"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const inquirer_1 = __importDefault(require("inquirer"));
const deploy_1 = require("./scripts/deploy");
const main = async () => {
    try {
        // 同步代码
        const spinner = (0, ora_1.default)('代码同步中...\n').start();
        (0, child_process_1.execSync)(`git pull`);
        spinner.succeed('代码同步成功');
    }
    catch (e) {
        console.log(e);
        process.exit(-1);
    }
    const cwd = process.cwd();
    const pkgPath = path_1.default.resolve(cwd, './package.json');
    const pkg = require(pkgPath);
    const timestamp = (0, dayjs_1.default)().format('YYYYMMDDHHmmssSSS');
    let branchName = (0, child_process_1.execSync)('git rev-parse --abbrev-ref HEAD').toString();
    branchName = branchName.trim().replace(/^[a-z]+\//g, '');
    let newVersion = `${pkg.version}-build.${timestamp}.${branchName}`;
    if ((0, deploy_1.isMonorepo)(cwd)) {
        const packageList = await (0, fast_glob_1.default)(['*'], { cwd: path_1.default.join(cwd, 'packages'), onlyDirectories: true });
        const answer = await inquirer_1.default.prompt([
            {
                name: 'packageName',
                message: '选择需要发布的package: ',
                type: 'list',
                choices: packageList.map(tagName => {
                    return {
                        name: tagName,
                        value: tagName
                    };
                })
            }
        ]);
        newVersion = `${newVersion}+${answer.packageName}`;
    }
    console.log(chalk_1.default.yellow(`发布版本: ${newVersion}`));
    try {
        const tagName = `v${newVersion}`;
        // 创建tag
        const spinner = (0, ora_1.default)('Tag创建中...\n').start();
        (0, child_process_1.execSync)(`git tag -f ${tagName}`);
        (0, child_process_1.execSync)(`git push -f --tags`);
        spinner.succeed('Tag创建成功');
        console.log(chalk_1.default.green(`\nTag(${tagName})已推送至Github`));
    }
    catch (e) {
        console.log(e);
        process.exit(-1);
    }
};
exports.default = new commander_1.Command('tag')
    .description('创建发测Tag')
    .action(async () => {
    await main();
});
