# 第二大脑 v4 维护巡检报告

日期：2026-07-23

## 总体状态

- Codex 定时自动化/云端工作流适合在电脑关机后继续执行公开信息收集、文件生成、知识库更新、邮件草稿和已授权邮件发送。
- 本地工作台、夸克浏览器、微信、飞书、剪映、Kalodata、FastMoss、达秘、TikClubs 等依赖本机或登录态的平台，在电脑关机或云端无浏览器授权时无法直接读取账号内数据。
- 不读取、不保存、不绕过密码、验证码、二次验证、支付密码或交易确认。

## 轻量巡检清单

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| outputs/ 写入 | 已检查 | runner 会写入每日简报、业务反馈、维护报告和邮件草稿 |
| 数据中心 JSON | 已检查 | runner 会更新 automation-workbench/data/ |
| 邮件发送 | 已发送 | 已发送 2 封邮件到 jacky060911@163.com, liu13922830178@outlook.com。 |
| 飞书备用交付 | 待配置 | 飞书备用交付未配置：缺少 FEISHU_WEBHOOK_URL。 |
| 飞书云文档交付 | 已发送 | 飞书云文档交付已同步。 |
| API/token 费用 | 额度正常 | 米醋 API 当前 API key 剩余额度为 不限额/订阅口径（New API token_usage，可核实 key 配额，但不是钱包人民币余额）；平台同时返回的 total_granted/total_used 仅作为诊断字段，不按人民币余额解读。人民币余额仍需配置钱包/账单接口或 MICU_API_BALANCE_CNY，低于 50 元人民币的充值提醒暂未自动启用。 |
| 平台真实接入 | 待本机/待登录核实 | 需要开机、登录态、API 或导出文件 |
| 金融交易 | 安全模式 | 只做资讯、提醒、纸面交易和人工确认前检查 |
| 社交/邮件外发 | 条件执行 | 邮件可在 SMTP 配置后自动发；社交外发仍建议人工确认 |

## 邮件交付

- 目标收件人：jacky060911@163.com, liu13922830178@outlook.com
- 若配置 SMTP_HOST、SMTP_PORT、SMTP_USER、SMTP_PASS、MAIL_FROM 且 SEND_EMAIL=true，runner 会尝试发送两封邮件：信息简报和业务反馈。
- 若未配置或发送失败，runner 只生成草稿并记录原因。

## 飞书备用交付

- 当前状态：飞书备用交付未配置：缺少 FEISHU_WEBHOOK_URL。
- 用途：当 GitHub Actions 云端无法连接 163 SMTP 时，自动把今日简报入口和关键状态推送到飞书。
- 需要配置：GitHub Secrets 中的 FEISHU_WEBHOOK_URL；如果飞书机器人开启签名校验，还需要 FEISHU_WEBHOOK_SECRET。GitHub Variables 可选配置 SEND_FEISHU=true/false。

## 飞书云文档交付

- 当前状态：飞书云文档交付已同步。
- 用途：把每日信息简报、业务反馈和维护巡检同步到飞书云文档，作为电脑关机后的云端存档入口。
- 需要配置：GitHub Secrets 中的 FEISHU_APP_ID、FEISHU_APP_SECRET、FEISHU_DOC_ID；GitHub Variables 可选配置 SEND_FEISHU_DOC=true/false。

## API/token 费用监控

- 提醒线：50 元人民币。
- 当前状态：米醋 API 当前 API key 剩余额度为 不限额/订阅口径（New API token_usage，可核实 key 配额，但不是钱包人民币余额）；平台同时返回的 total_granted/total_used 仅作为诊断字段，不按人民币余额解读。人民币余额仍需配置钱包/账单接口或 MICU_API_BALANCE_CNY，低于 50 元人民币的充值提醒暂未自动启用。
- 若需要自动读取米促 API 真实余额，需要配置 MICU_API_BALANCE_URL、MICU_API_KEY 或 MICU_API_TOKEN，以及必要时的 MICU_API_BALANCE_JSON_PATH。

## 运行与维护成本

| 成本项 | 当前判断 | 说明 |
| --- | --- | --- |
| 米促 API/token | 额度正常 | 米醋 API 当前 API key 剩余额度为 不限额/订阅口径（New API token_usage，可核实 key 配额，但不是钱包人民币余额）；平台同时返回的 total_granted/total_used 仅作为诊断字段，不按人民币余额解读。人民币余额仍需配置钱包/账单接口或 MICU_API_BALANCE_CNY，低于 50 元人民币的充值提醒暂未自动启用。 |
| GitHub Actions / 云端任务 | 待账单核实 | 若在免费额度内通常为 0 元人民币；超出后以 GitHub 账号账单为准。 |
| Codex / OpenAI 调用 | 待账单核实 | 取决于模型、token、工具调用和自动化频率；每次复杂任务开始前应先给出预计人民币成本区间。 |
| 163 SMTP 邮件 | 预计 0 元人民币 | 只发送到已配置白名单邮箱；真实可用性以 SMTP 发送结果为准。 |
| 第三方平台订阅 | 待平台核实 | Kalodata、FastMoss、达秘/TikClubs、数据源、剪映会员等由各平台独立收费。 |
| 本地电脑运行 | 低额但非零 | 开机运行会消耗电费和网络；关机后需依赖云端或常久在线机器。 |

维护策略：每日轻量同步 API 余额和邮件状态；每周同步系统运行、稳定性、云端任务、平台入口、skills/plugins 和预估人民币维护成本。

## 云端/本地边界

- 电脑关机后：本地工作台不能运行；Codex 定时自动化、GitHub Actions、VPS/NAS 或其他常久在线服务可以继续运行。
- 开机后：本地工作台可以查看 outputs/、知识库、历史记录和执行队列，也可以打开本机平台和桌面软件。
- 自我学习/自我迭代：可以通过每日/每周云端任务收集公开资料、更新知识库、产出维护报告；安装第三方代码、连接新平台、真实外发和真实交易仍需要明确确认。
