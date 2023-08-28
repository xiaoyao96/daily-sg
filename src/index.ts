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
}: {
  loginName: string;
  passWord: string;
  content: string;
  prefix: boolean;
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
    spainner.text = "正在获取项目ID";
    const projectId = await getProjectId();
    console.log(chalk.green(`：${projectId}`));

    spainner.text = "正在获取服务器时间";
    const { data: dateTime } = await getDateTime();
    console.log(chalk.green(`：${dateTime}`));

    spainner.text = "正在获取本月的未完成报告数量";
    const {
      data: { data: list },
    } = await queryCalendar({
      userId: userInfo.userId,
      recordDate: dateTime.substring(0, 7),
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
          .map((item: any) => item.start + item.recordTypeStr)
          .join("\n")}\n总共${
          undoList.length
        }个。（一般一天2个，上午与下午各1个）`
      )
    );

    for (let i = 0; i < undoList.length; i++) {
      spainner.text = `正在发布日报: ${i + 1}/${undoList.length}`;
      const undoItem = undoList[i];
      const recordDate = undoItem.start.substring(0, 10);
      const recordType: number = undoItem.recordTypeStr === "上午" ? 1 : 2;
      const itemContent = prefix
        ? `${recordDate}${undoItem.recordTypeStr}完成工作：\n${content}`
        : content;
      await insertWorker({
        userId: userInfo.userId,
        deptIds: userInfo.deptIds,
        projectId,
        recordDate,
        recordType,
        content: itemContent,
      });
    }
    spainner.succeed(`已完成报告: ${undoList.length}个`);
    // console.log(chalk.green(`已完成日报: ${undoList.length}个`));
  } catch (err: any) {
    spainner.text = "操作失败";
    console.log(chalk.red(`\n错误：`, err.message));
    spainner.fail();
    process.exit(1)
  }
}

process.on("exit", () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
});

async function getProjectId() {
  const { userInfo } = getState();

  const { data: res } = await getProjectList({
    userId: userInfo.userId,
  });
  if (res.status) {
    const target = res.data.find((item: any) => item.name.includes("富民"));
    if (target) {
      return target.id;
    }
  }
  throw new Error("未找到项目Id");
}
