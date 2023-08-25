# daily-sg 

[![NPM version](https://img.shields.io/npm/v/daily-sg.svg)](https://www.npmjs.com/package/daily-sg)  

上古的自动日报命令行工具

- 获取当月的所有漏填日报（包含今日）自动填写
- 可自动给内容加日期前缀

## 安装

```shell
npm install -g daily-sg
```

## 使用

```shell
daily-sg start [日报内容] -u [用户名] -p [密码] -pre [是否给日报内容自动添加日期前缀]
```

| 参数          | 默认值 | 说明                                                                                               |
| ------------- | ------ | -------------------------------------------------------------------------------------------------- |
| -u,--username | 无     | 登录的用户名                                                                                       |
| -p,--password | 无     | 登录的密码                                                                                         |
| -pre,--prefix | false  | 是否给日报内容自动添加日期前缀 <br />增加前缀后的日报内容为: YYYY-MM-DD 上午(或下午)完成内容：xxxx |

## 示例

用户名为 zhangsan，密码为 123456，日报内容为“负责 xxx 项目的日常维护与迭代。”

```shell
daily-sg start "负责xxx项目的日常维护与迭代。" -u zhangsan -p 123456 -pre true
```

```
⠇ 正在登录中登录成功：zhangsan
⠙ 正在获取项目ID：123
⠸ 正在获取服务器时间：2023-08-25 18:03:19
⠏ 正在获取本月的未完成日报数量：2个
✔ 已完成日报: 2个
```
