"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prompts = void 0;
exports.prompts = [
    {
        type: "list",
        name: "use",
        message: "Select Use:",
        choices: [
            { name: "Monorepo - 单仓库多项目", value: "monorepo" },
            { name: "Default - 单仓库单项目", value: "default" },
        ],
    },
    {
        type: "list",
        name: "platform",
        message: "Select Platform:",
        choices: [
            { name: "Desktop - 电脑端", value: "pc" },
            { name: "Mobile - 手机端", value: "h5" },
        ],
    },
];
