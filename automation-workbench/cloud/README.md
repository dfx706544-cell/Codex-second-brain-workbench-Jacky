# 第二大脑 v4 云端接入包

目标：让第二大脑工作台具备“电脑关机后仍能继续收集资讯、生成简报、沉淀知识库、自我迭代”的能力。

## 当前状态

- 本地工作台已完成：`automation-workbench/`
- 本地 Codex 自动化已完成：每日 8 点、每周自我迭代审计
- 当前缺口：本工作区还没有绑定 GitHub 远程仓库，也没有已接入的远程/云端项目

## 推荐路线

### 第一阶段：Codex Cloud + GitHub 私有仓库

适合做：

- 每日信息简报
- 业务反馈
- 知识库更新
- 自我迭代审计
- 工作台代码和数据文件的持续改进

需要用户亲自完成：

1. 打开 `https://chatgpt.com/codex`
2. 连接 GitHub 账号
3. 创建一个私有仓库，例如 `second-brain-workbench`
4. 把当前工作区推送到这个私有仓库
5. 在 Codex Cloud 里选择这个仓库并配置环境

### 第二阶段：远程 SSH / VPS / NAS

适合做：

- 24 小时定时任务
- 邮件发送器
- 数据库
- 长期日志
- 更稳定的任务调度

需要用户提供：

- VPS、NAS 或远程主机
- SSH 登录方式
- 是否允许安装 Node/Python/Codex CLI

## 云端环境建议

在 Codex Cloud 环境里建议开启：

- Node.js
- Python
- 网络访问，用于公开资讯搜索和网页读取
- 仓库写入权限，用于写入 `outputs/` 和 `automation-workbench/data/`

不建议在第一阶段配置：

- 邮箱密码
- 交易账号
- 支付信息
- 社交平台密码

## 安全边界

云端可自主做：

- 搜集公开资讯
- 生成中文简报
- 生成业务反馈
- 更新知识库 JSON
- 生成邮件草稿
- 输出 skill/plugin 候选建议

云端不可自主做：

- 发送邮件
- 发送社交消息
- 发布内容
- 真实交易
- 支付或下单
- 保存密码、验证码、支付码、交易密码
- 自动安装第三方代码

## 本地同步方式

推荐用 GitHub 作为中间层：

1. 云端把结果提交到私有仓库。
2. 你开机后，本地拉取最新仓库内容。
3. 工作台读取更新后的 `automation-workbench/data/` 和 `outputs/`。

如果之后部署 VPS，可以改成：

1. VPS 每天跑任务。
2. VPS 把结果推到 GitHub 或对象存储。
3. 本地工作台开机后同步数据。

## 关键文件

- `cloud-daily-brief-prompt.md`：每日 8 点云端任务提示词
- `cloud-weekly-evolution-prompt.md`：每周自我迭代任务提示词
- `cloud-sync-policy.md`：云端和本地同步规则
- `codex-cloud-setup-checklist.md`：新手操作清单
