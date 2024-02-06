"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const fsPromise = __importStar(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const commander_1 = require("commander");
const js_yaml_1 = __importDefault(require("js-yaml"));
const mkdirp_1 = __importDefault(require("mkdirp"));
const deploy_1 = require("../scripts/deploy");
const chalk_1 = __importDefault(require("chalk"));
const initCMDBYaml = async () => {
    const cwd = process.cwd();
    const pkg = require(path_1.default.join(cwd, 'package.json'));
    await fsPromise.writeFile(path_1.default.join(cwd, '.cmdb.yaml'), js_yaml_1.default.dump(Object.assign({}, {
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
};
const initGithubWorkflows = async () => {
    const cwd = process.cwd();
    const dest = path_1.default.join(cwd, '.github/workflows');
    await fsPromise.mkdir(dest, {
        recursive: true
    });
    await fsPromise.writeFile(path_1.default.join(dest, 'development.yaml'), js_yaml_1.default.dump({
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
    }));
    await fsPromise.writeFile(path_1.default.join(dest, 'testing.yaml'), js_yaml_1.default.dump({
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
    }));
    await fsPromise.writeFile(path_1.default.join(dest, 'production.yaml'), js_yaml_1.default.dump({
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
    }));
};
const initDeployScripts = async () => {
    const cwd = process.cwd();
    const pkgPath = path_1.default.join(cwd, 'package.json');
    const pkg = require(pkgPath);
    // npm scripts
    if (!pkg.scripts) {
        pkg.scripts = {};
    }
    pkg.scripts.deploy = 'node ./scripts/cmdb-deploy.js';
    // 创建脚本目录
    const scriptsDir = path_1.default.join(cwd, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
        await (0, mkdirp_1.default)(scriptsDir);
    }
    // 拷贝部署脚本文件
    const scriptSrc = path_1.default.resolve(__dirname, '../scripts/deploy.js');
    const scriptDest = path_1.default.join(scriptsDir, 'cmdb-deploy.js');
    await fsPromise.cp(scriptSrc, scriptDest);
    await fsPromise.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    // 安装运行时依赖
    if ((0, deploy_1.isMonorepo)(cwd)) {
        (0, child_process_1.execSync)('pnpm add -w mime fast-glob yargs-parser chalk@^4.1.2 semver -D', {
            cwd, stdio: 'inherit'
        });
    }
    else {
        (0, child_process_1.execSync)('pnpm add mime fast-glob yargs-parser chalk@^4.1.2 semver -D', {
            cwd, stdio: 'inherit'
        });
    }
};
exports.default = new commander_1.Command('init')
    .description('初始化CMDB配置文件')
    .action(async () => {
    await initCMDBYaml();
    await initGithubWorkflows();
    await initDeployScripts();
    console.log(chalk_1.default.greenBright('CMDB配置文件初始化完成'));
});
