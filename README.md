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

| 参数          | 类型    | 默认值 | 说明                                                                                               |
| ------------- | ------- | ------ | -------------------------------------------------------------------------------------------------- |
| -u,--username | string  | 无     | 登录的用户名                                                                                       |
| -p,--password | string  | 无     | 登录的密码                                                                                         |
| -pre,--prefix | boolean | false  | 是否给日报内容自动添加日期前缀 <br />增加前缀后的日报内容为: YYYY-MM-DD 上午(或下午)完成内容：xxxx |
| -d,--date     | string  | 本月   | 指定自动填报月份，格式为 YYYY-MM，默认为当前月份，如 2023-08                                       |

## 示例

用户名为 zhangsan，密码为 123456，日报内容为“负责 xxx 项目的日常维护与迭代。”

```shell
daily-sg start "负责xxx项目的日常维护与迭代。" -u zhangsan -p 123456 -pre true
```

```
⠇ 正在登录中登录成功：zhangsan
⠙ 正在获取项目ID：123
⠸ 正在获取服务器时间：2023-08-28 11:18:04
⠏ 正在获取2023-08的未完成日报数量：
2023-08-28上午
2023-08-28下午
总共2个。（一般一天2个，上午与下午各1个）
✔ 已完成日报: 2个
```


## 利用github自动化日报

### 1、创建工程
github中新建一个工程，创建.github/workflows/ci.yml 文件。yml代码如下：

```yml
name: daily-sg

on:
  schedule:
    # 每天下午5点发日报
    - cron: "0 9 * * *" 
  workflow_dispatch:
jobs:
  auto-daily:
    runs-on: ubuntu-latest
    steps:
      # 步骤名获取最新代码
      - name: 🚚 Get latest code
        uses: actions/checkout@v3
      # 安装node环境
      - name: Use Node.js 18
        uses: actions/setup-node@v3
        with:
          node-version: "18.x"
      # 执行命令
      - name: Run shell
        run: npx daily-sg start "这里为日报内容" -u ${{ secrets.USER }} -p ${{ secrets.PWD }} -pre true

```

然后提交代码并推送到你的仓库

### 2、配置环境变量

可以留意到yml脚本命令中含有环境变量`secrets.USER`和`secrets.PWD`，为了安全起见，github提供了环境变量功能，操作方法如下：  

1、进入该项目的settings，选择`"Security"`-`"Actions secrets and variables"`-`"Action"`  

2、进入`"Action"`页面后，在`"Repository secrets"`项下创建你登录账号`"USER"`变量与密码`"PWD"`变量。

如果你不想使用变量，也可以直接将上述yml代码中的`${{ secrets.USER }}`和`${{ secrets.PWD }}` 部分替换为具体值。

### 3、测试

一般进行到第2步后，actions就已经生效了，脚本将会每天下午5点执行。但如果你想手动执行试试，则可按如下操作：  
在该工程下进入`"Actions"`页面，在左侧选择`"daily-sg"`，在右侧找到`"Run workflow"`按钮，选择分支后手动刷新页面等待结果，可点击进入查看执行日志。

