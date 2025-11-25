import chalk from "chalk";
import {
  getInfo,
  // getDateTime,
  getProjectList,
  login,
  queryLegalCalendar,
  queryTimeAndAttendance,
  saveOrUpdateWorker,
} from "./api";
import { getState, setState } from "./store";
import dayjs from "dayjs";
import ora from "ora";

export async function start({
  username,
  password,
  content,
  prefix,
  date,
}: {
  username: string;
  password: string;
  content: string;
  prefix: boolean;
  date: string;
}) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const spainner = ora("loading").start();
  try {
    spainner.text = "正在登录中";
    const res = await login({
      username,
      password,
    });
    console.log(chalk.green(`登录成功：${username}`));
    setState("cookie", res.headers["set-cookie"]?.[0].split(";")[0]);
    setState("userInfo", res.data.data);

    spainner.text = "当前选择月份";

    const { data } = await getInfo();
    const now = dayjs(data.data.user.loginDate, "YYYY-MM-DD HH:mm:SS");
    const dateTime = date || now.format("YYYY-MM");

    console.log(chalk.green(`：${dateTime}`));
    spainner.text = "正在获取项目ID与项目名称";
    const { id: projectId, projectName } = await getProjectId(dateTime + "-01");
    console.log(chalk.green(`：${projectId}、${projectName}`));

    spainner.text = `正在获取${dateTime}的未完成报告数量`;

    const [year, month] = dateTime.split("-");
    const {
      data: { data: legalCalendar },
    } = await queryLegalCalendar({
      year,
      month,
    });

    const {
      data: { data: list },
    } = await queryTimeAndAttendance({ year, month });

    const workingList = list.filter(
      (item: any) =>
        needWorking(item.workDate, legalCalendar) &&
        (dayjs(item.workDate).isSame(now, "day") ||
          dayjs(item.workDate).isBefore(now, "day"))
    );

    const saveList = workingListToSaveList(workingList, {
      projectId,
      recordContent: content,
      prefix,
    });

    console.log(
      chalk.green(
        `：\n${saveList.map((item) => item.title).join("\n")}\n总共${
          saveList.length
        }个。（一般一天2个，上午与下午各1个）`
      )
    );

    // return;
    let errorCount = 0;
    for (let i = 0; i < saveList.length; i++) {
      if (errorCount === 0) {
        spainner.text = `正在发布日报: ${i + 1}/${
          saveList.length
        } ${chalk.green(`（${saveList[i].title}）`)}`;
      }

      try {
        await saveOrUpdateWorker(saveList[i].sendData);
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
    spainner.succeed(`已完成报告: ${saveList.length}个`);
    // console.log(chalk.green(`已完成日报: ${workingList.length}个`));
  } catch (err: any) {
    spainner.text = "操作失败";
    console.log(chalk.red(`\n错误：`, err.message));
    console.error(err);
    spainner.fail();
    process.exit(1);
  }
}

process.on("exit", () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
});

async function getProjectId(recordDate: string) {
  const year = dayjs(recordDate, "YYYY-MM-DD").format("YYYY");
  const { data: res } = await getProjectList({ recordDate });
  if (res.data) {
    const target = res.data.find(
      (item: any) =>
        item.projectName.includes("富民") && item.projectName.includes(year)
    );
    if (target) {
      return target;
    }
  }
  throw new Error("未找到项目Id");
}

interface LegalCalendarItem {
  legalDate: string;
  /** 1-工作 2-放假 */
  workingFlag: number;
}

/**
 *
 * @param date 日期
 */
function needWorking(date: string, legalCalendar: LegalCalendarItem[]) {
  const d = dayjs(date, "YYYY-MM-DD");
  const target = legalCalendar.find(
    (item) => item.legalDate === d.format("YYYY-MM-DD")
  );
  if (target) {
    return target.workingFlag === 1;
  }

  // 默认工作日周一到周五
  return d.day() !== 0 && d.day() !== 6;
}

interface SaveItem {
  title: string;
  sendData: {
    projectId: string;
    recordType: string;
    workingHours: number;
    recordContent: string;
    recordDate: string;
  };
}

interface WorkItem {
  personName: string;
  workDate: string;
  workNo: string;
  workingList: {
    recordType: number;
    projectId: string | null;
    workingHours: number;
    recordContent: string;
    recordDate: string;
  }[];
}

function workingListToSaveList(
  workingList: WorkItem[],
  config: {
    projectId: string;
    recordContent: string;
    prefix: boolean;
  }
): SaveItem[] {
  const saveList: SaveItem[] = [];
  workingList.forEach((item) => {
    if (
      item.workingList.some(
        (item) =>
          item.recordType === 1 &&
          item.projectId === null &&
          item.recordContent === null
      )
    ) {
      // 补充上午
      saveList.push({
        title: `${item.workDate}上午`,
        sendData: {
          projectId: config.projectId,
          recordType: "1",
          workingHours: 4,
          recordContent: config.prefix
            ? `${item.workDate}上午完成工作：\n${config.recordContent}`
            : config.recordContent,
          recordDate: item.workDate,
        },
      });
    }

    if (
      item.workingList.some(
        (item) =>
          item.recordType === 2 &&
          item.projectId === null &&
          item.recordContent === null
      )
    ) {
      // 补充下午
      saveList.push({
        title: `${item.workDate}下午`,
        sendData: {
          projectId: config.projectId,
          recordType: "2",
          workingHours: 4,
          recordContent: config.prefix
            ? `${item.workDate}下午完成工作：\n${config.recordContent}`
            : config.recordContent,
          recordDate: item.workDate,
        },
      });
    }
  });

  return saveList;
}
