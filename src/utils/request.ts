import Axios from "axios";
import https from "https";
import { BaseUrl } from "../config";
import { getState } from "../store";

const axios = Axios.create({
  baseURL: BaseUrl,
  headers: {
    Host: "www.jssgwl.com:4431",
    Origin: "https://www.jssgwl.com:4431/",
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.54",
  },
  timeout: 20000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  withCredentials: true,
});

axios.interceptors.request.use((req) => {
  const { userInfo, cookie } = getState();
  if (userInfo) {
    req.headers["token"] = userInfo.uuid;
    req.headers["cookie"] = cookie;
  }
  return req;
});

axios.interceptors.response.use((res) => {
  if (typeof res.data === "string") {
    return res;
  } else if (typeof res.data === "object" && res.data.status) {
    return res;
  }
  return Promise.reject(res.data);
});

export default axios;
