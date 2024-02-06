"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMonorepo = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mime_1 = __importDefault(require("mime"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const yargs_parser_1 = __importDefault(require("yargs-parser"));
const child_process_1 = require("child_process");
const isMonorepo = (dir) => {
    // 如果存在workspace文件则视为monorepo项目
    return fs_1.default.existsSync(path_1.default.join(dir, 'pnpm-workspace.yaml'))
        && fs_1.default.statSync(path_1.default.join(dir, 'packages')).isDirectory();
};
exports.isMonorepo = isMonorepo;
const getContentType = (ext) => {
    const DEFAULT = 'application/octet-stream';
    if (!ext)
        return DEFAULT;
    return mime_1.default.getType(ext) || DEFAULT;
};
const getCacheControl = (ext) => {
    let result = '"no-cache, private, stale-if-error=0"';
    const cacheControlRule = [
        // 内容文件
        {
            test: /(htm|html|json)$/,
            value: result,
        },
        // 媒体文件
        {
            test: /(css|js|jpg|jpeg|png|gif|bmp|ico|webp|svg|eot|ttf|woff|woff2|otf|ttc|pfa|mp3|mp4)$/,
            value: '"public, max-age=31536000"',
        },
        // JS map文件
        {
            test: /(map)$/,
            value: '"public, max-age=31536000"',
        }
    ];
    for (let i = 0; i < cacheControlRule.length; i++) {
        const rule = cacheControlRule[i];
        if (rule.test.test(ext)) {
            result = rule.value;
            break;
        }
    }
    return result;
};
const main = async () => {
    const bucketNames = {
        development: 'zw.static.development',
        testing: 'zw.static.testing',
        production: 'zw.static.production'
    };
    const publicPaths = {
        development: 'https://d6ylfj8t99yj7.cloudfront.net',
        testing: 'https://djv6pqfad59nl.cloudfront.net',
        production: 'https://dhq5fp8fx2oin.cloudfront.net'
    };
    const cwd = process.cwd();
    const projectIsMonorepo = (0, exports.isMonorepo)(cwd);
    const { env, version, versionBuild: packageName } = (0, yargs_parser_1.default)(process.argv);
    const projectInfo = require(path_1.default.join(cwd, 'package.json'));
    if (projectIsMonorepo && !packageName) {
        throw new Error('未指定子项目');
    }
    // build 前端代码
    let packageDir;
    let publicPath;
    if (projectIsMonorepo) {
        packageDir = path_1.default.join(cwd, `packages/${packageName}`);
        publicPath = `${publicPaths[env]}/${projectInfo.name}/${packageName}/`;
    }
    else {
        packageDir = cwd;
        publicPath = `${publicPaths[env]}/${projectInfo.name}/`;
    }
    (0, child_process_1.execSync)(`FE_BUILD_ENV=${env} FE_PUBLIC_PATH=${publicPath} pnpm run build`, {
        cwd: packageDir,
        stdio: 'inherit'
    });
    const sourceDir = path_1.default.join(packageDir, 'dist');
    const result = await (0, fast_glob_1.default)(['**/*'], { cwd: sourceDir, onlyFiles: true });
    result.sort((a, b) => {
        if (a.endsWith('.html') && !b.endsWith('.html')) {
            return 1;
        }
        else if (!a.endsWith('.html') && b.endsWith('.html')) {
            return -1;
        }
        return 0;
    });
    result.forEach(filePath => {
        const fileAbsPath = path_1.default.resolve(sourceDir, filePath);
        const fileExt = path_1.default.extname(fileAbsPath);
        const contentType = getContentType(fileExt);
        const cacheControl = getCacheControl(fileExt);
        let s3Uri;
        if (projectIsMonorepo) {
            s3Uri = `s3://${bucketNames[env]}/${projectInfo.name}/${packageName}/${filePath}`;
        }
        else {
            s3Uri = `s3://${bucketNames[env]}/${projectInfo.name}/${filePath}`;
        }
        // console.log(`aws s3 cp --content-type ${contentType} --cache-control ${cacheControl} ${fileAbsPath} ${s3Uri}`)
        (0, child_process_1.execSync)(`aws s3 cp --content-type ${contentType} --cache-control ${cacheControl} ${fileAbsPath} ${s3Uri}`, {
            cwd: sourceDir,
            stdio: 'inherit',
        });
    });
};
if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exit(-1);
    });
}
