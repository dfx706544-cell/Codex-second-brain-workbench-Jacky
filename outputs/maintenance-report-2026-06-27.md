# 第二大脑 v4 维护巡检报告

日期：2026-06-27

## 总体状态

- Codex 定时自动化/云端工作流适合在电脑关机后继续执行公开信息收集、文件生成、知识库更新、邮件草稿和已授权邮件发送。
- 本地工作台、夸克浏览器、微信、飞书、剪映、Kalodata、FastMoss、达秘、TikClubs 等依赖本机或登录态的平台，在电脑关机或云端无浏览器授权时无法直接读取账号内数据。
- 不读取、不保存、不绕过密码、验证码、二次验证、支付密码或交易确认。

## 轻量巡检清单

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| outputs/ 写入 | 已检查 | runner 会写入每日简报、业务反馈、维护报告和邮件草稿 |
| 数据中心 JSON | 已检查 | runner 会更新 automation-workbench/data/ |
| 邮件发送 | 发送失败 | 邮件发送遇到错误：daily brief: Port should be >= 0 and < 65536. Received type number (NaN).; business feedback: Port should be >= 0 and < 65536. Received type number (NaN). |
| API/token 费用 | 待授权 | 余额监控未配置/待授权：请配置米促 API 的余额查询地址和密钥；未核实前不编造金额。 |
| 平台真实接入 | 待本机/待登录核实 | 需要开机、登录态、API 或导出文件 |
| 金融交易 | 安全模式 | 只做资讯、提醒、纸面交易和人工确认前检查 |
| 社交/邮件外发 | 条件执行 | 邮件可在 SMTP 配置后自动发；社交外发仍建议人工确认 |

## 邮件交付

- 目标收件人：MAIL_TO
- 若配置 SMTP_HOST、SMTP_PORT、SMTP_USER、SMTP_PASS、MAIL_FROM 且 SEND_EMAIL=true，runner 会尝试发送两封邮件：信息简报和业务反馈。
- 若未配置或发送失败，runner 只生成草稿并记录原因。

## API/token 费用监控

- 提醒线：50 元人民币。
- 当前状态：余额监控未配置/待授权：请配置米促 API 的余额查询地址和密钥；未核实前不编造金额。
- 若需要自动读取米促 API 真实余额，需要配置 MICU_API_BALANCE_URL、MICU_API_KEY 或 MICU_API_TOKEN，以及必要时的 MICU_API_BALANCE_JSON_PATH。

## 云端/本地边界

- 电脑关机后：本地工作台不能运行；Codex 定时自动化、GitHub Actions、VPS/NAS 或其他常久在线服务可以继续运行。
- 开机后：本地工作台可以查看 outputs/、知识库、历史记录和执行队列，也可以打开本机平台和桌面软件。
- 自我学习/自我迭代：可以通过每日/每周云端任务收集公开资料、更新知识库、产出维护报告；安装第三方代码、连接新平台、真实外发和真实交易仍需要明确确认。
