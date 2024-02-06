import type { PathLike } from 'fs';
import fs from 'fs';
import path from 'path';
import mime  from 'mime';
import fastGlob from 'fast-glob';
import parseArgs from 'yargs-parser';
import { execSync } from 'child_process';

export const isMonorepo = (dir: PathLike) => {
  // 如果存在workspace文件则视为monorepo项目
  return fs.existsSync(path.join(dir as string, 'pnpm-workspace.yaml'))
    && fs.statSync(path.join(dir as string, 'packages')).isDirectory();
}

const getContentType = (ext: string) => {
  const DEFAULT = 'application/octet-stream';
  if (!ext) return DEFAULT;
  return mime.getType(ext) || DEFAULT;
};

const getCacheControl = (ext: string) => {
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
  const bucketNames: Record<string, string> = {
    development: 'zw.static.development',
    testing: 'zw.static.testing',
    production: 'zw.static.production'
  }
  const publicPaths: Record<string, string> = {
    development: 'https://d6ylfj8t99yj7.cloudfront.net',
    testing: 'https://djv6pqfad59nl.cloudfront.net',
    production: 'https://dhq5fp8fx2oin.cloudfront.net'
  }
  const cwd = process.cwd();
  const projectIsMonorepo = isMonorepo(cwd);
  const {
    env,
    version,
    versionBuild: packageName
  } = parseArgs(process.argv);
  const projectInfo = require(path.join(cwd, 'package.json'));

  if (projectIsMonorepo && !packageName) {
    throw new Error('未指定子项目');
  }

  // build 前端代码
  let packageDir;
  let publicPath;
  if (projectIsMonorepo) {
    packageDir = path.join(cwd, `packages/${packageName}`);
    publicPath = `${publicPaths[env]}/${projectInfo.name}/${packageName}/`;
  } else {
    packageDir = cwd;
    publicPath = `${publicPaths[env]}/${projectInfo.name}/`;
  }

  execSync(`FE_BUILD_ENV=${env} FE_PUBLIC_PATH=${publicPath} pnpm run build`, {
    cwd: packageDir,
    stdio: 'inherit'
  });
  const sourceDir = path.join(packageDir, 'dist');
  const result = await fastGlob(['**/*'], { cwd: sourceDir, onlyFiles: true });
  result.sort((a, b) => {
    if (a.endsWith('.html') && !b.endsWith('.html')) {
      return 1;
    } else if (!a.endsWith('.html') && b.endsWith('.html')) {
      return -1;
    }

    return 0;
  });
  result.forEach(filePath => {
    const fileAbsPath = path.resolve(sourceDir, filePath);
    const fileExt = path.extname(fileAbsPath);
    const contentType = getContentType(fileExt);
    const cacheControl = getCacheControl(fileExt);

    let s3Uri;
    if (projectIsMonorepo) {
      s3Uri = `s3://${bucketNames[env]}/${projectInfo.name}/${packageName}/${filePath}`;
    } else {
      s3Uri = `s3://${bucketNames[env]}/${projectInfo.name}/${filePath}`;
    }

    // console.log(`aws s3 cp --content-type ${contentType} --cache-control ${cacheControl} ${fileAbsPath} ${s3Uri}`)
    execSync(
      `aws s3 cp --content-type ${contentType} --cache-control ${cacheControl} ${fileAbsPath} ${s3Uri}`,
      {
        cwd: sourceDir,
        stdio: 'inherit',
      }
    )
  });
};

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(-1);
  });
}
