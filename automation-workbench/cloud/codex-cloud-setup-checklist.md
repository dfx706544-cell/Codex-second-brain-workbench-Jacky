# Codex Cloud 接入新手清单

## 目标

让第二大脑 v4 在电脑关机后仍能通过云端继续运行每日简报、业务反馈、知识库更新和自我迭代审计。

## 第一步：打开 Codex Cloud

我已经帮你打开：

- `https://chatgpt.com/codex`
- `https://chatgpt.com/codex/settings/environments`

你需要亲自完成登录、验证码和授权。

## 第二步：连接 GitHub

在 Codex Cloud 页面连接 GitHub。

建议新建私有仓库：

```text
second-brain-workbench
```

## 第三步：把本地项目放进 GitHub

如果你还没有安装 Git 或没有配置仓库，可以先停在这里让我继续帮你检查。

当前检查结果：

- 云端接入文件已齐全。
- 本地存在 `.git` 目录。
- 当前终端里 `git` 命令不可用，可能是没有安装 Git，或 Git 没有加入 PATH。
- 当前项目没有配置 GitHub `origin` 远程仓库。

推荐仓库内容包含：

- `automation-workbench/`
- `workflows/`
- `templates/`
- `outputs/`
- `docs/`

不要上传：

- 密码
- Cookie
- 验证码
- 浏览器缓存
- 交易账号凭证

## 第四步：配置 Codex Cloud 环境

建议环境：

- Node.js：开启
- Python：开启
- Internet access：允许公开资讯搜索
- Secrets：第一阶段不填邮箱或交易密码

## 第五步：创建云端每日任务

使用提示词：

```text
automation-workbench/cloud/cloud-daily-brief-prompt.md
```

计划时间：每天 08:00，Asia/Shanghai。

## 第六步：创建云端每周自我迭代任务

使用提示词：

```text
automation-workbench/cloud/cloud-weekly-evolution-prompt.md
```

计划时间：每周一 09:30，Asia/Shanghai。

## 第七步：本地同步

电脑开机后，从 GitHub 拉取最新内容。

工作台会读取：

- `automation-workbench/data/`
- `outputs/`

## 当前人工确认点

你需要确认：

1. 是否已经能打开 Codex Cloud 页面。
2. 是否愿意使用 GitHub 私有仓库作为云端和本地同步层。
3. 是否已经有 GitHub 账号可以连接。
4. 是否之后要我继续帮你安装 Git、初始化仓库并准备首次上传。

## 完成授权后给 Codex 的口令

完成 GitHub 和 Codex Cloud 授权后，可以直接对我说：

```text
我已经连接好 GitHub 和 Codex Cloud，请继续初始化仓库、绑定远程仓库并配置云端每日任务。
```

如果 Git 仍不可用，可以说：

```text
请帮我安装 Git 并把第二大脑工作台推送到 GitHub 私有仓库。
```
