import inquirer from "inquirer";
import chalk from "chalk";
import { exit } from "process";
import { remove, existsSync, readFileSync, writeFileSync } from "fs-extra";
import validateProjectName from "validate-npm-package-name";
import logSymbols from "log-symbols";
import latestVersion from "latest-version";
import ora from "ora";

import { cleanConsole, downloadTemplate, install } from "./utils";
import { prompts } from "./inquirer";
import { repositoryByVue, repositoryByMonorepo, cwdDir } from "./constant";
import { resolve } from "path";

interface Answers {
  use: string;
  platform: string;
}

export class Generator {
  name: string;
  url: string = "";
  answers: Answers = { use: "", platform: "" };

  constructor(name: string) {
    this.name = name;
    this.init();
  }

  async init() {
    this.checkProjectName();
    await this.ask();
    this.url = this.answers.use === "monorepo" ? repositoryByMonorepo : repositoryByVue;
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
          message: `${chalk.cyan(process.cwd() + "/" + this.name)} already exists, please select the action:`,
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
        console.log(`🗑 ${chalk.cyan(`The ${process.cwd()}/${this.name} directory is being deleted ...`)}`);
        await remove(this.name);
        cleanConsole();
      }
    }
  }

  downloadFn() {
    downloadTemplate(this.url, this.name, true, async () => {
      await this.editFilesInfo();
      this.installDependence();
    });
  }

  async editFilesInfo() {
    const projectRoot = resolve(cwdDir, this.name);
    const projectCtx = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf-8"));
    const dependences = this.answers.platform === "pc" ? ["ant-design-vue", "@ant-design/icons-vue"] : ["vant"];
    projectCtx.name = this.name;
    const spinner = ora("Writing Dependences...");
    spinner.start();
    for (const item of dependences) {
      const pkgVersion = await latestVersion(item);
      projectCtx.dependencies[item] = `^${pkgVersion}`;
    }
    writeFileSync(resolve(projectRoot, "package.json"), JSON.stringify(projectCtx, null, 4));
    spinner.stop();
  }

  installDependence() {
    // 安装项目依赖
    install({ cwd: `./${this.name}`, tool: "pnpm" })
      .then(() => {
        console.log(logSymbols.success, chalk.green("🎉 Generate Success"));
      })
      .catch((err) => {
        console.log("err", err);
      });
  }
}
