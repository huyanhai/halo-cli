import path from 'path';
import { execSync } from 'child_process';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import dayjs from 'dayjs';
import fastGlob from 'fast-glob';
import inquirer from 'inquirer';
import { isMonorepo } from './scripts/deploy';

const main = async () => {
  try {
    // 同步代码
    const spinner = ora('代码同步中...\n').start();
    execSync(`git pull`);
    spinner.succeed('代码同步成功');
  } catch (e) {
    console.log(e)
    process.exit(-1)
  }

  const cwd = process.cwd();
  const pkgPath = path.resolve(cwd, './package.json');
  const pkg = require(pkgPath);
  const timestamp = dayjs().format('YYYYMMDDHHmmssSSS');
  let branchName = execSync('git rev-parse --abbrev-ref HEAD').toString();
  branchName = branchName.trim().replace(/^[a-z]+\//g, '');
  let newVersion = `${pkg.version}-build.${timestamp}.${branchName}`;

  if (isMonorepo(cwd)) {
    const packageList = await fastGlob(['*'], { cwd: path.join(cwd, 'packages'), onlyDirectories: true });
    const answer = await inquirer.prompt([
      {
        name: 'packageName',
        message: '选择需要发布的package: ',
        type: 'list',
        choices: packageList.map(tagName => {
          return {
            name: tagName,
            value: tagName
          }
        })
      }
    ])
    newVersion = `${newVersion}+${answer.packageName}`;
  }

  console.log(chalk.yellow(`发布版本: ${newVersion}`));

  try {
    const tagName = `v${newVersion}`;

    // 创建tag
    const spinner = ora('Tag创建中...\n').start();
    execSync(`git tag -f ${tagName}`);
    execSync(`git push -f --tags`);
    spinner.succeed('Tag创建成功');

    console.log(chalk.green(`\nTag(${tagName})已推送至Github`))
  } catch (e) {
    console.log(e)
    process.exit(-1)
  }
};

export default new Command('tag')
  .description('创建发测Tag')
  .action(async () => {
    await main();
  });
