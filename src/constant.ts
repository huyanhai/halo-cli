import fs from "fs";
import { resolve } from "path";

export const pkg = JSON.parse(fs.readFileSync(resolve(__dirname, "../package.json"), "utf-8"));
export const cwdDir = process.cwd();

export const baseRepository = "direct:https://github.com/huyanhai/base-templates";
export const repositoryByVue = "direct:https://github.com/huyanhai/base-templates#vue3";
export const repositoryByMonorepo = "direct:https://github.com/huyanhai/base-templates#monorepo";
