import { Command } from "commander";
import figlet from "figlet";
import { pkg } from "./constant";
import { Generator } from "./generator";
import cmdb from './cmdb';

const program = new Command();

export const run = () => {
  program.version(pkg.version, "-V,--version");
  program
    .command("init <app-name>")
    .alias("i")
    .description("init project")
    .action((name) => {
      new Generator(name);
    });
  program.on("--help", () => {
    console.log(
      figlet.textSync("halo", {
        font: "isometric3",
        horizontalLayout: "full",
        verticalLayout: "full",
      })
    );
  });

  // cmdb 相关命令
  program.addCommand(cmdb);

  program.parse(process.argv);
};
