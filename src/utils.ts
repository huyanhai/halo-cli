import readline from "readline";
import ora from "ora";
import download from "download-git-repo";
import logSymbols from "log-symbols";
import { exit } from "process";
import spawn from "cross-spawn";
import chalk from "chalk";
import which from "which";

/**
 * 清除控制台内容
 */
export const cleanConsole = () => {
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
};

/**
 * 下载模板
 * @param url
 * @param pathName
 * @param clone
 * @param cb
 */
export const downloadTemplate = async (url: string, pathName: string, clone = false, cb: () => void) => {
  const spinner = ora("Downloading ...");
  spinner.start();
  download(url, pathName, { clone: clone }, async (err: string) => {
    spinner.stop();
    if (err) {
      console.log(logSymbols.error, chalk.red(`Download Failed: ${err}`));
      exit(1);
    } else {
      cb && cb();
    }
  });
};

export const install = (option: { cwd: string; tool: string }) => {
  const cwd = option.cwd;
  return new Promise((resolve, reject) => {
    const command = option.tool;
    const args = ["install"];
    try {
      which.sync(command);
    } catch (error) {
      throw new Error(chalk.red(`${command} not install`));
    }

    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.once("close", (code: number) => {
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
