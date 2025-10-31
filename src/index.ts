import chalk from "chalk";
import {
  getDateTime,
  getProjectList,
  insertWorker,
  login,
  queryCalendar,
} from "./api";
import { getState, setState } from "./store";
import dayjs from "dayjs";
import ora from "ora";

export async function start({
  loginName,
  passWord,
  content,
  prefix,
  date,
}: {
  loginName: string;
  passWord: string;
  content: string;
  prefix: boolean;
  date: string;
}) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const spainner = ora("loading").start();
  try {
    spainner.text = "正在登录中";
    const res = await login({
      loginName,
      passWord,
    });
    console.log(chalk.green(`登录成功：${loginName}`));

    setState("cookie", res.headers["set-cookie"]?.[0].split(";")[0]);
    setState("userInfo", res.data.data);
    const { userInfo } = getState();

    spainner.text = "当前选择月份";
    const { data: dateTime } = await getDateTime();

    let recordDate = date || dateTime.substring(0, 7);
    console.log(chalk.green(`：${recordDate}`));
    spainner.text = "正在获取项目ID与项目名称";
    const { id: projectId, name } = await getProjectId(
      recordDate.substring(0, 4)
    );
    console.log(chalk.green(`：${projectId}、${name}`));

    spainner.text = `正在获取${recordDate}的未完成报告数量`;
    const {
      data: { data: list },
    } = await queryCalendar({
      userId: userInfo.userId,
      recordDate,
    });

    const undoList = list.filter(
      (item: any) =>
        ["漏填", ""].includes(item.handFlag) &&
        ["上午", "下午"].includes(item.recordTypeStr) &&
        dayjs(dateTime.substring(0, 10)).diff(
          item.start.substring(0, 10),
          "day"
        ) >= 0
    );

    console.log(
      chalk.green(
        `：\n${undoList
          .map((item: any) => item.start.substring(0, 10) + item.recordTypeStr)
          .join("\n")}\n总共${
          undoList.length
        }个。（一般一天2个，上午与下午各1个）`
      )
    );
    let errorCount = 0;
    for (let i = 0; i < undoList.length; i++) {
      if (errorCount === 0) {
        spainner.text = `正在发布日报: ${i + 1}/${
          undoList.length
        } ${chalk.green(
          `（${
            undoList[i].start.substring(0, 10) + undoList[i].recordTypeStr
          }）`
        )}`;
      }

      const undoItem = undoList[i];
      const recordDate = undoItem.start.substring(0, 10);
      const recordType: number = undoItem.recordTypeStr === "上午" ? 1 : 2;
      const itemContent = prefix
        ? `${recordDate}${undoItem.recordTypeStr}完成工作：\n${content}`
        : content;
      try {
        await insertWorker({
          userId: userInfo.userId,
          deptIds: userInfo.deptIds,
          projectId,
          recordDate,
          recordType,
          content: itemContent,
        });
      } catch (err: any) {
        if (errorCount < 3) {
          console.log(
            chalk.red(
              `\n发现错误：${err?.message},正在重试第${errorCount + 1}次`
            )
          );
          errorCount++;
          i--;
          continue;
        } else {
          throw err;
        }
      }
      errorCount = 0;
    }
    spainner.succeed(`已完成报告: ${undoList.length}个`);
    // console.log(chalk.green(`已完成日报: ${undoList.length}个`));
  } catch (err: any) {
    spainner.text = "操作失败";
    console.log(chalk.red(`\n错误：`, err.message));
    spainner.fail();
    process.exit(1);
  }
}

process.on("exit", () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
});

async function getProjectId(year: string) {
  const { userInfo } = getState();

  const { data: res } = await getProjectList({
    userId: userInfo.userId,
  });
  if (res.status) {
    const target = res.data.find(
      (item: any) => item.name.includes("富民") && item.name.includes(year)
    );
    if (target) {
      return target;
    }
  }
  throw new Error("未找到项目Id");
}
