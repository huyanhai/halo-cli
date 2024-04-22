import fs from "fs";
import { resolve } from "path";

export const pkg = JSON.parse(
  fs.readFileSync(resolve(__dirname, "../package.json"), "utf-8")
);
export const cwdDir = process.cwd();
export const cacheDirName = ".template_cache";
export const templateName = "template";

export const baseRepository =
  "direct:https://github.com/huyanhai/base-templates";
export const repositoryByVue =
  "direct:https://github.com/huyanhai/base-templates#vue3";
export const repositoryByReact =
  "direct:https://github.com/huyanhai/base-templates#react";
export const repositoryByMonorepo =
  "direct:https://github.com/huyanhai/base-templates#monorepo";
export const repositoryByMonorepoForVue =
  "direct:https://github.com/huyanhai/base-templates#monorepo-vue";
