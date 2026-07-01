# GitHub Actions 工作流指南

这个工作台仓库有 3 个核心工作流。它们已经按执行顺序和用途重新命名，打开 Actions 左侧列表时可以直接看懂。

## 工作流速查

| 显示名称 | 文件 | 作用 | 什么时候点 Run workflow |
| --- | --- | --- | --- |
| 01 Daily Brief - Generate & Email | `.github/workflows/second-brain-daily.yml` | 生成每日信息简报、业务反馈、维护报告、邮件正文，并在配置齐全时发邮件 | 想立刻补跑今日简报/邮件时 |
| 02 Weekly Evolution - Audit & Improve | `.github/workflows/second-brain-weekly.yml` | 生成每周复盘、系统进化建议、长期维护审计 | 每周手动复查或想立即生成周报时 |
| 03 Workbench Pages - Publish Web App | `.github/workflows/pages.yml` | 构建并发布公开的工作台网页到 GitHub Pages | 修改前端页面或想手动重新发布页面时 |

## 推荐使用顺序

1. 每天主要看 `01 Daily Brief - Generate & Email`。
2. 每周看 `02 Weekly Evolution - Audit & Improve`。
3. 改了 `automation-workbench/app/` 后运行 `03 Workbench Pages - Publish Web App`。

## 自动触发时间

`01 Daily Brief - Generate & Email` 有多次定时触发，用来提高云端任务稳定性：

- UTC 00:00、00:10、00:30、01:00
- 对中国用户大致对应北京时间早上 08:00 到 09:00

`02 Weekly Evolution - Audit & Improve`：

- 每周一 UTC 01:30
- 对中国用户大致对应北京时间周一 09:30

`03 Workbench Pages - Publish Web App`：

- 修改 `automation-workbench/app/**`
- 修改 `automation-workbench/scripts/build-cloud-share.mjs`
- 修改 `.github/workflows/pages.yml`
- 或手动点击 `Run workflow`

## 邮件和外部服务配置

每日简报要真实发送邮件，需要在 `Settings -> Secrets and variables -> Actions` 配置：

| 类型 | 名称 | 用途 |
| --- | --- | --- |
| Secret | `SMTP_HOST` | SMTP 服务器 |
| Secret | `SMTP_PORT` | SMTP 端口 |
| Secret | `SMTP_USER` | 发信账号 |
| Secret | `SMTP_PASS` | SMTP 授权码 |
| Secret | `MAIL_FROM` | 发件人 |
| Secret | `MAIL_TO` | 收件人，多个邮箱用英文逗号分隔 |
| Variable | `SMTP_SECURE` | 通常填 `true` |
| Variable | `SEND_EMAIL` | 配好 SMTP 后填 `true` |

没有配置完整时，工作流只生成草稿和报告，不会编造已发送状态。

## 运维判断

- 想看每日产出：打开 `outputs/` 和 `automation-workbench/data/`。
- 想看网页发布：打开 `03 Workbench Pages - Publish Web App` 的最新运行。
- 想确认邮件是否发送：看 `outputs/maintenance-report-latest.md` 或 `automation-workbench/data/daily-briefs.json` 里的 `status`。

## 注意

GitHub 自动生成的 `pages-build-deployment` 如果出现在 Actions 列表里，不需要改名，也不用手动运行。它只是 GitHub Pages 的系统部署记录。
