import * as fs from 'fs';
import * as fsPromise from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { Command } from 'commander';
import jsYaml from 'js-yaml';
import mkdirp from 'mkdirp';
import { isMonorepo } from '../scripts/deploy';
import chalk from 'chalk';

const initCMDBYaml = async () => {
  const cwd = process.cwd();
  const pkg = require(path.join(cwd, 'package.json'));

  await fsPromise.writeFile(path.join(cwd, '.cmdb.yaml'), jsYaml.dump(Object.assign({}, {
    group: 'fe',
    name: pkg.name,
    build: 'pnpm install --frozen-lockfile && pnpm run deploy --env ${profile} --version ${version} --versionBuild ${version_build}',
    artifacts: [{
      destination: 'append-to-notification',
      artifact: './devops-notification',
    }],
  }), {
    lineWidth: -1,
    noCompatMode: true
  }));
}

const initGithubWorkflows = async () => {
  const cwd = process.cwd();
  const dest = path.join(cwd, '.github/workflows')

  await fsPromise.mkdir(dest, {
    recursive: true
  });

  await fsPromise.writeFile(path.join(dest, 'development.yaml'), jsYaml.dump({
    name: '开发环境',
    on: 'push',
    jobs: {
      build: {
        ['runs-on']: ['self-hosted', 'dev'],
        steps: [{
          uses: 'actions/checkout@v2'
        }, {
          name: '构建镜像，并发布到开发环境',
          env: {
            CMDB_PROFILE: 'development'
          },
          run: 'cmdb upgrade'
        }]
      }
    }
  }, {
    lineWidth: -1,
    noCompatMode: true
  }))

  await fsPromise.writeFile(path.join(dest, 'testing.yaml'), jsYaml.dump({
    name: '测试环境',
    on: { push: { tags: ['v*'] } },
    jobs: {
      build: {
        ['runs-on']: ['self-hosted', 'linux', 'x64'],
        steps: [{
          uses: 'actions/checkout@v2'
        }, {
          name: '构建镜像，并发布到测试环境',
          env: {
            CMDB_PROFILE: 'testing'
          },
          run: 'cmdb upgrade'
        }]
      }
    }
  }, {
    lineWidth: -1,
    noCompatMode: true
  }))

  await fsPromise.writeFile(path.join(dest, 'production.yaml'), jsYaml.dump({
    name: '生产环境',
    on: { release: { types: ['created'] } },
    jobs: {
      build: {
        ['runs-on']: ['self-hosted', 'linux', 'x64'],
        steps: [{
          uses: 'actions/checkout@v2'
        }, {
          name: '构建镜像，并发布到生产环境',
          env: {
            CMDB_PROFILE: 'production'
          },
          run: 'cmdb upgrade'
        }]
      }
    }
  }, {
    lineWidth: -1,
    noCompatMode: true
  }))
}

const initDeployScripts = async () => {
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'package.json');
  const pkg = require(pkgPath);

  // npm scripts
  if (!pkg.scripts) {
    pkg.scripts = {}
  }
  pkg.scripts.deploy = 'node ./scripts/cmdb-deploy.js';

  // 创建脚本目录
  const scriptsDir = path.join(cwd, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    await mkdirp(scriptsDir);
  }

  // 拷贝部署脚本文件
  const scriptSrc = path.resolve(__dirname, '../scripts/deploy.js');
  const scriptDest = path.join(scriptsDir, 'cmdb-deploy.js');
  await fsPromise.cp(scriptSrc, scriptDest);
  await fsPromise.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // 安装运行时依赖
  if (isMonorepo(cwd)) {
    execSync('pnpm add -w mime fast-glob yargs-parser chalk@^4.1.2 semver -D', {
      cwd, stdio: 'inherit'
    });
  } else {
    execSync('pnpm add mime fast-glob yargs-parser chalk@^4.1.2 semver -D', {
      cwd, stdio: 'inherit'
    });
  }
}

export default new Command('init')
  .description('初始化CMDB配置文件')
  .action(async () => {
    await initCMDBYaml();
    await initGithubWorkflows();
    await initDeployScripts();

    console.log(chalk.greenBright('CMDB配置文件初始化完成'));
  });
