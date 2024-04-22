"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prompts = exports.LanguageType = exports.WayType = exports.PlatformType = exports.UseType = void 0;
var UseType;
(function (UseType) {
    UseType["MONOREPO"] = "monorepo";
    UseType["DEFAULT"] = "default";
})(UseType = exports.UseType || (exports.UseType = {}));
var PlatformType;
(function (PlatformType) {
    PlatformType["PC"] = "pc";
    PlatformType["H5"] = "h5";
})(PlatformType = exports.PlatformType || (exports.PlatformType = {}));
var WayType;
(function (WayType) {
    WayType["Library"] = "library";
    WayType["Project"] = "project";
})(WayType = exports.WayType || (exports.WayType = {}));
var LanguageType;
(function (LanguageType) {
    LanguageType["Vue"] = "vue";
    LanguageType["React"] = "react";
})(LanguageType = exports.LanguageType || (exports.LanguageType = {}));
exports.prompts = [
    {
        type: "list",
        name: "use",
        message: "Select Use:",
        choices: [
            { name: "Monorepo - 单仓库多项目", value: UseType.MONOREPO },
            { name: "Default - 单仓库单项目", value: UseType.DEFAULT },
        ],
    },
    {
        type: "list",
        name: "way",
        message: "Select Use:",
        choices: [
            { name: "Library - 库", value: WayType.Library },
            { name: "Project - 项目", value: WayType.Project },
        ],
        when(answers) {
            return answers.use === UseType.MONOREPO;
        },
    },
    {
        type: "list",
        name: "platform",
        message: "Select Platform:",
        choices: [
            { name: "Desktop - 电脑端", value: PlatformType.PC },
            { name: "Mobile - 手机端", value: PlatformType.H5 },
        ],
    },
    {
        type: "list",
        name: "language",
        message: "Select Use:",
        choices: [
            { name: "Vue - 基于vue开发", value: LanguageType.Vue },
            { name: "React - 基于React开发", value: LanguageType.React },
        ],
    },
];
