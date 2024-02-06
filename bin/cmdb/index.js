"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = __importDefault(require("./init"));
const tag_1 = __importDefault(require("./tag"));
exports.default = new commander_1.Command('cmdb')
    .description('前端CMDB工具')
    .addCommand(init_1.default)
    .addCommand(tag_1.default);
