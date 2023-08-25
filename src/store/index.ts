interface UserInfo {
  userId: number;
  uuid: string;
  deptIds: string;
  [key: string]: any;
}

export const state = {
  userInfo: null as unknown as UserInfo,
  cookie: ""
};

export const getState = () => state;

export const setState = (key: keyof typeof state, value: any) => {
  state[key] = value;
};
