"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repositoryByMonorepoForVue = exports.repositoryByMonorepo = exports.repositoryByReact = exports.repositoryByVue = exports.baseRepository = exports.templateName = exports.cacheDirName = exports.cwdDir = exports.pkg = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
exports.pkg = JSON.parse(fs_1.default.readFileSync((0, path_1.resolve)(__dirname, "../package.json"), "utf-8"));
exports.cwdDir = process.cwd();
exports.cacheDirName = ".template_cache";
exports.templateName = "template";
exports.baseRepository = "direct:https://github.com/huyanhai/base-templates";
exports.repositoryByVue = "direct:https://github.com/huyanhai/base-templates#vue3";
exports.repositoryByReact = "direct:https://github.com/huyanhai/base-templates#react";
exports.repositoryByMonorepo = "direct:https://github.com/huyanhai/base-templates#monorepo";
exports.repositoryByMonorepoForVue = "direct:https://github.com/huyanhai/base-templates#monorepo";
