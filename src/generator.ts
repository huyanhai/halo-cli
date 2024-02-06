import inquirer from "inquirer";
import chalk from "chalk";
import { exit } from "process";
import {
  remove,
  existsSync,
  readFileSync,
  writeFileSync,
  moveSync,
} from "fs-extra";
import validateProjectName from "validate-npm-package-name";
import logSymbols from "log-symbols";
import latestVersion from "latest-version";
import ora from "ora";

import { cleanConsole, downloadTemplate, install } from "./utils";
import { WayType, prompts } from "./inquirer";
import {
  repositoryByVue,
  repositoryByMonorepo,
  repositoryByMonorepoForVue,
  cwdDir,
  cacheDirName,
  templateName,
} from "./constant";
import { resolve } from "path";

import { PromptsType, UseType, PlatformType } from "./inquirer";

export class Generator {
  name: string;
  url: string = "";
  answers: PromptsType = { use: UseType.DEFAULT, platform: PlatformType.PC };

  constructor(name: string) {
    this.name = name;
    this.init();
  }

  async init() {
    this.checkProjectName();
    await this.ask();
    this.url =
      this.answers.use === UseType.MONOREPO
        ? repositoryByMonorepo
        : repositoryByVue;
    this.downloadFn();
  }

  checkProjectName() {
    const projectName = validateProjectName(this.name);
    if (!projectName.validForNewPackages) {
      console.error(chalk.red(`Invalid project name: "${this.name}"`));
      projectName.errors &&
        projectName.errors.forEach((err: string) => {
          console.error(chalk.red.dim("Error: " + err));
        });
      projectName.warnings &&
        projectName.warnings.forEach((warn: string) => {
          console.error(chalk.red.dim("Warning: " + warn));
        });
      exit(1);
    }
  }

  async ask() {
    await this.checkTargetDir();
    this.answers = await inquirer.prompt(prompts);
  }

  // 检查目录是否存在
  async checkTargetDir() {
    if (existsSync(this.name)) {
      const { action } = await inquirer.prompt([
        {
          name: "action",
          type: "list",
          message: `${chalk.cyan(
            process.cwd() + "/" + this.name
          )} already exists, please select the action:`,
          choices: [
            { name: "Overwrite", value: "overwrite" },
            { name: "Cancel", value: false },
          ],
        },
      ]);
      if (!action) {
        exit(0);
      }
      if (action === "overwrite") {
        console.log(
          `🗑 ${chalk.cyan(
            `The ${process.cwd()}/${this.name} directory is being deleted ...`
          )}`
        );
        await remove(this.name);
        cleanConsole();
      }
    }
  }

  async downloadFn() {
    this.answers.way === WayType.Project && this.writeFiles();
    downloadTemplate(this.url, this.name, true, async () => {
      await this.editFilesInfo();
      this.answers.way === WayType.Project && (await this.moveFiles());
      this.installDependence();
    });
  }

  // 写入模版文件
  async writeFiles() {
    const cachePath = resolve(process.cwd(), cacheDirName);
    const filePath = resolve(process.cwd(), `${cacheDirName}/package.json`);
    if (existsSync(cachePath)) {
      await remove(cachePath);
    }

    downloadTemplate(repositoryByMonorepoForVue, cacheDirName, true, () => {
      const projectCtx = JSON.parse(readFileSync(filePath, "utf-8"));
      projectCtx.name = `@${this.name}/${templateName}`;
      writeFileSync(filePath, JSON.stringify(projectCtx, null, 4));
    });
  }

  // 移动模版文件
  async moveFiles() {
    const cachePath = resolve(process.cwd(), cacheDirName);
    const projectRoot = resolve(cwdDir, this.name, `packages/${templateName}`);
    return moveSync(cachePath, projectRoot);
  }

  async editFilesInfo() {
    const projectRoot = resolve(cwdDir, this.name);
    if (this.answers.use === UseType.MONOREPO) {
      this.editTsconfig(projectRoot);
    }

    const projectCtx = JSON.parse(
      readFileSync(resolve(projectRoot, "package.json"), "utf-8")
    );

    const dependencies =
      this.answers.platform === PlatformType.PC
        ? ["ant-design-vue", "@ant-design/icons-vue"]
        : ["vant"];
    projectCtx.name = this.name;

    if (this.answers.way === WayType.Project) {
      projectCtx['devDependencies'][`@${this.name}/${templateName}`] = "workspace:^";
    }

    const spinner = ora("Writing Dependencies...");
    spinner.start();
    for (const item of dependencies) {
      const pkgVersion = await latestVersion(item);
      projectCtx.dependencies[item] = `^${pkgVersion}`;
    }

    writeFileSync(
      resolve(projectRoot, "package.json"),
      JSON.stringify(projectCtx, null, 4)
    );

    spinner.stop();
  }

  async editTsconfig(projectRoot: string) {
    const configCtx = JSON.parse(
      readFileSync(resolve(projectRoot, "tsconfig.json"), "utf-8")
    );
    configCtx.compilerOptions.paths = {
      [`@${this.name}/*`]: ["packages/*"],
    };
    writeFileSync(
      resolve(projectRoot, "tsconfig.json"),
      JSON.stringify(configCtx, null, 2)
    );
  }

  // 安装项目依赖
  installDependence() {
    install({ cwd: `./${this.name}`, tool: "pnpm" })
      .then(() => {
        console.log(logSymbols.success, chalk.green("🎉 Generate Success"));
      })
      .catch((err) => {
        console.log("err", err);
      });
  }
}
