#! /usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { start } from ".";

const { version } = require("../package.json");
const program = new Command();

program.name("daily-sg").description("自动执行上古网络日报").version(version);

program
  .command("start")
  .description("开始执行日报自动发布")
  .argument("<string>", "内容")
  .requiredOption("-u, --username <string>", "用户名")
  .requiredOption("-p, --password <string>", "密码")
  .option("-d, --date <string>", "指定填报月份，格式为YYYY-MM")
  .option("-pre, --prefix <boolean>", "是否给内容加日期前缀", false)
  .action((str, options) => {
    if (str.length < 5) {
      console.log(chalk.red(`输入的日报内容过短，至少长度为5`));
      return process.exit(1);
    }

    start({
      loginName: options.username,
      passWord: options.password,
      content: str,
      prefix: options.prefix,
      date: options.date,
    });
  });

program.parse();
