import { AxiosResponse } from "axios";
import axios from "../utils/request";

interface LoginParams {
  username: string;
  password: string;
}

export function login({ username, password }: LoginParams) {
  return axios.post("/login", {
    username,
    password,
  });
}

export function getProjectList(params: { recordDate: string }) {
  return axios.get("/project/management/queryByUserId", {
    params,
  });
}

export function getInfo() {
  return axios.get("/getInfo");
}

export function saveOrUpdateWorker(params: any) {
  return axios.post("/work/saveOrUpdate", params);
}

export function queryTimeAndAttendance(params: {
  year: string;
  month: string;
}) {
  return axios.get("/work/queryTimeAndAttendance", {
    params,
  });
}

/** 查询法定节假日hu */
export function queryLegalCalendar(params: { year: string; month: string }) {
  return axios.get("/work/queryCalendar", {
    params,
  });
}
