# 第二大脑自动化工作台 v4 云端/本地验证报告

日期：2026-06-27
时区：Asia/Shanghai

## 当前结论

1. GitHub Actions 云端后台已经具备“电脑关机后继续运行”的基础能力。
2. Codex 本地自动化已经配置每日 8 点和每周维护任务，但本地自动化依赖本机与 Codex 环境，不能保证电脑关机后运行。
3. 云端每日任务会生成 outputs/ 文件和 automation-workbench/data/ 记录，并准备两封邮件草稿；默认不直接发送邮件。
4. 米醋 API 余额提醒逻辑已经接入代码：可核实余额低于 50 元人民币时提醒充值；没有可核实来源时标注待授权，不编造余额。
5. 真实邮件发送、社交平台外发、支付、交易、验证码、二次验证、安装第三方代码，仍然必须由用户确认或亲自完成。

## 已确认项目

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| GitHub Actions 每日任务 | 已配置 | `.github/workflows/second-brain-daily.yml`，北京时间每日 08:00 运行 |
| GitHub Actions 每周任务 | 已配置 | `.github/workflows/second-brain-weekly.yml`，北京时间周一 09:30 运行 |
| GitHub Actions runtime | 已升级 | `actions/checkout@v7.0.0`，`actions/setup-node@v6.4.0` |
| 云端每日 runner | 已接入 | `automation-workbench/scripts/second-brain-cloud-runner.mjs` |
| 邮件发送模块 | 草稿优先 | 未配置 SMTP 或 `SEND_EMAIL=true` 时，只生成草稿 |
| API 余额监控 | 已接入 | 支持 `MICU_API_BALANCE_CNY` 或余额查询 URL/API key |
| Codex 本地每日自动化 | 已存在 | 自动化 id：`v4`，每日 08:00 |
| Codex 本地每周维护 | 已存在 | 自动化 id：`v4-2`，每周一 09:30 |
| Git 凭据助手 | 已确认 | 全局 helper 为 `manager` |

## 已验证命令

- `node --test automation-workbench/scripts/api-budget-monitor.test.mjs automation-workbench/scripts/email-delivery.test.mjs automation-workbench/scripts/second-brain-cloud-runner.test.mjs automation-workbench/scripts/check-cloud-readiness.test.mjs automation-workbench/scripts/github-pages-share.test.mjs`
- 结果：14 个测试通过，0 失败。
- `node automation-workbench/scripts/build-cloud-share.mjs --out .pages-site`
- 结果：云端分享页可构建。

## 云端和本地边界

云端可做：
- 定时生成信息简报、业务反馈、维护报告和邮件草稿。
- 写入仓库中的 `outputs/` 和 `automation-workbench/data/`。
- 在配置搜索/API key 后，抓取公开资讯并保留来源链接。
- 在配置 SMTP 后，按安全策略发送邮件。

本地才方便做：
- 打开夸克、微信、飞书、剪映、Kalodata、FastMoss 等依赖本机登录态的平台。
- 读取本机浏览器中已登录页面的可见内容。
- 操作 Office 桌面版、剪映桌面版和本机文件。

必须用户确认：
- 任何验证码、二次验证、密码、支付密码、交易密码。
- 真实充值、支付、交易、下单。
- 真实发送邮件、社交私信、客户消息、公开发布。
- 安装第三方 skill/plugin/software 或创建持久 API/OAuth 权限。

## 仍需补齐的授权/配置

1. GitHub Actions Secrets/Variables
   - `ANYSEARCH_API_KEY`：用于真实联网搜索。
   - `MICU_API_BALANCE_URL`、`MICU_API_KEY` 或 `MICU_API_TOKEN`、`MICU_API_BALANCE_JSON_PATH`：用于真实余额监控。
   - `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`MAIL_TO`、`MAIL_FROM`、`SEND_EMAIL=true`：用于真实邮件发送。

2. 米醋 API 余额
   - 当前逻辑已经支持低于 50 元提醒。
   - 只有在配置真实余额接口或手动写入可核实余额快照后，云端才会判断余额。
   - 如果只是浏览器页面看到余额，需要本机打开并授权读取，云端不能凭页面记忆长期监控。

3. 平台数据
   - Kalodata、FastMoss、TikClubs、抖音、小红书、微信、飞书等平台若没有 API 或导出文件，云端不能稳定读取账号后台。
   - 可行路径：本机登录后前台/后台读取可见页面，或你导出 Excel/CSV 到 `inputs/`，或配置官方 API/数据导出。

## 今日风险提示

- 本地工作区存在未提交的个人数据、outputs 和工作台改动，当前没有直接 pull 或 reset，避免覆盖本地历史。
- 远端 `origin/main` 已包含 workflow 升级提交 `e13b87d`。
- 当前本地 `main` 与远端有分叉，后续如需同步，应先备份本地 `automation-workbench/data/` 和 `outputs/`，再做有选择的合并。

## 下一步建议

1. 优先配置 `ANYSEARCH_API_KEY`，让每日简报从结构草稿升级为真实资讯简报。
2. 配置 163 邮箱 SMTP 授权码，但保持 `SEND_EMAIL=false` 先测试草稿，确认后再开启真实发送。
3. 为米醋 API 找到真实余额接口，或先用 `MICU_API_BALANCE_CNY` 做人工快照提醒。
4. 给朋友使用的云端模板继续保持静态干净模板；若未来做多人长期使用，再加入账号系统、独立数据库和权限隔离。
