import { AxiosResponse } from "axios";
import axios from "../utils/request";

interface LoginParams {
  loginName: string;
  passWord: string;
}

export function login({ loginName, passWord }: LoginParams) {
  return axios.post("/user/login", {
    loginName,
    passWord,
    openId: "",
  });
}

export function getProjectList({ userId }: { userId: number }) {
  return axios.post("/project/queryByUserId", {
    userId,
  });
}

export function getDateTime(): Promise<AxiosResponse<string>> {
  return axios.post("/common/getDateTime");
}

export function insertWorker(params: {
  userId: number;
  deptIds: string;
  recordDate: string;
  recordType: number;
  projectId: number;
  content: string;
}) {
  return axios.post("/record/insert", {
    userId: params.userId,
    deptIds: params.deptIds,
    recordDate: params.recordDate,
    recordType: params.recordType,
    times: 4,
    projectId: params.projectId,
    taskId: "",
    content: params.content,
  });
}

export function queryCalendar(params: { userId: number; recordDate: string }) {
  return axios.post("/record/queryCalendar", params);
}
