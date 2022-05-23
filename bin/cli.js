"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const commander_1 = require("commander");
const figlet_1 = __importDefault(require("figlet"));
const constant_1 = require("./constant");
const generator_1 = require("./generator");
const program = new commander_1.Command();
const run = () => {
    program.version(constant_1.pkg.version, "-V,--version");
    program
        .command("init <app-name>")
        .alias("i")
        .description("init project")
        .action((name) => {
        new generator_1.Generator(name);
    });
    program.on("--help", () => {
        console.log(figlet_1.default.textSync("halo", {
            font: "isometric3",
            horizontalLayout: "full",
            verticalLayout: "full",
        }));
    });
    program.parse(process.argv);
};
exports.run = run;
