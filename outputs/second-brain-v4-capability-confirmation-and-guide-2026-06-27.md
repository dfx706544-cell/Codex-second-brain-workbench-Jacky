# 第二大脑自动化工作台 v4 能力确认与使用指南

日期：2026-06-27
收录时间：2026-06-27 13:10 Asia/Shanghai

## 一句话确认

可以确认：第二大脑自动化工作台 v4 已经具备稳定本地运行、与 Codex 协作、平台入口接入、队列执行、文件交付、知识库/历史记录、每日/每周自动化框架、维护助手和云端工作流骨架。
不能说满：所有第三方平台账号内数据、真实邮件发送、真实关机后长期运行、API 余额长期读取、自我安装未知插件、真实交易/支付，仍需要对应授权、云端配置和关键动作确认。

## 已经实测通过的能力

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 本地工作台打开 | 已通过 | 启动脚本返回 `http://127.0.0.1:8800/automation-workbench/app/` |
| 桌面快捷方式 | 已修复 | 指向 `automation-workbench/scripts/start-workbench-desktop.cmd` |
| 工作台与 Codex 队列协作 | 已通过 | 工作台写入队列，Codex 可按执行口令读取并执行 |
| 平台入口打开 | 已通过 | bridge 提供 `/api/platforms/open` |
| Office 文件交付 | 已具备 | 可生成 Word/PPT/Excel 到 `outputs/` |
| 每日简报/业务反馈草稿 | 已具备 | 今日增强版文件已生成 |
| 知识库/历史记录 | 已具备 | 可写入 `automation-workbench/data/` |
| 维护助手 | 已具备 | 检查平台、队列、bridge、outputs、云端/本地边界 |
| 云端工作流骨架 | 已配置 | GitHub Actions daily/weekly/pages 文件存在 |
| API 余额提醒逻辑 | 已具备 | 低于 50 元提醒逻辑存在，且之前真实触发过低余额信号 |
| 测试体系 | 已通过 | 相关本地测试通过 |

## 已接入的平台入口

- 跨境电商：Kalodata、FastMoss、达秘 / TikClubs
- 办公/沟通：飞书、微信、163 邮箱、Gmail
- 创作者平台：TikTok、YouTube、Instagram、抖音、微信视频号、小红书
- 金融信息：SEC、HKEXnews
- 技术/知识：GitHub、Google Scholar

说明：这里的“接入”指工作台能打开真实平台入口、能加入任务口令、能在授权页面或导出文件基础上协助处理；不等于已经拥有所有平台账号后台 API 权限。

## 还需要你授权或配置的能力

| 能力 | 为什么还不能说已完全完成 | 需要你做什么 |
| --- | --- | --- |
| 电脑关机后仍自动运行 | 本地工作台依赖本机；关机后必须靠 GitHub Actions/Codex Cloud/VPS/NAS | 确认 GitHub Actions Secrets、邮件、搜索 API、余额接口都配置好 |
| 每天 8 点自动发邮件 | 代码已支持直接发送和多收件人；但真实发送必须在云端配置 SMTP/邮箱连接器 | 配置 163 SMTP 授权码或邮箱连接器，并设置 `SEND_EMAIL=true` |
| 账号作品数据自动复盘 | 抖音/TikTok/小红书后台数据需要登录态、API 或导出 | 登录后授权可见页面，或导出 Excel/CSV 到 `inputs/` |
| 达人沟通成功率 | 需要读取飞书/微信/邮箱/TikTok 私信或你的跟进表 | 导出沟通记录或授权我读取可见页面 |
| Kalodata/FastMoss/达秘后台数据 | 需要你登录平台或导出数据 | 登录页面后让我读取可见内容，或导出候选达人表 |
| API 余额长期监控 | 需要真实余额接口或手动快照变量 | 配置 `MICU_API_BALANCE_URL`/key/json path，或定期写入已核实余额 |
| 自我安装插件/skills | 第三方代码有安全风险 | 仍需具体候选确认后安装 |
| 真实交易/支付/发布/发送 | 高风险外部动作 | 必须人工确认，不能无人值守 |

## 最常用使用方式

### 方式 1：在工作台里下任务

1. 双击桌面 `Codex自动化工作台`。
2. 在工作台输入自然语言需求。
3. 选择主助手、协同助手、平台、skill、交付方式。
4. 点击加入队列或复制执行口令。
5. 把执行口令发给我。
6. 我会读取队列、调用对应能力、把结果保存到 `outputs/`。

### 方式 2：直接在这里让我执行

你可以说：

```text
请打开我们制作的自动化工作台，处理里面的执行队列；优先执行最新任务，结果保存到 outputs/。
```

或者更具体：

```text
请用工作助手和 Office 助手，基于 inputs/ 里的达人数据，筛选 10 个适合假睫毛的男达人，并生成 Excel。
```

### 方式 3：每日简报/业务反馈

当前可以生成草稿到：

- `outputs/daily-brief-日期.md`
- `outputs/business-feedback-日期.md`
- `outputs/maintenance-report-日期.md`
- `outputs/email-draft-daily-brief-日期.md`
- `outputs/email-draft-business-feedback-日期.md`

真实邮件发送现在支持两个收件人：`jacky060911@163.com` 和 `liu13922830178@outlook.com`。需要在 GitHub Actions Secrets/Variables 或 Codex Cloud 环境里配置：

```text
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=你的163邮箱账号
SMTP_PASS=你的163邮箱SMTP授权码
MAIL_FROM=你的发件邮箱
MAIL_TO=jacky060911@163.com,liu13922830178@outlook.com
SEND_EMAIL=true
```

不要把 SMTP 授权码发在聊天里；放到 GitHub Secrets 或云端密钥里。

## 各助手怎么用

| 助手 | 适合任务 |
| --- | --- |
| Office 助手 | Word、PPT、Excel、报表、简历、方案、表格清洗 |
| 工作助手/BD 助手 | Kalodata、FastMoss、达秘/TikClubs、达人筛选、建联清单 |
| 资讯助手 | 每日简报、金融/业务/平台热点、来源整理 |
| 金融助手 | 美股/港股资讯、观察清单、纸面交易、持仓提醒，不下单 |
| 自媒体/IP 助手 | 抖音/TikTok/小红书/视频号脚本、账号复盘、个人 IP 规划 |
| 剪辑/自媒体助手 | 剪映打开、剪辑建议、脚本拆镜，不绕过软件权限 |
| 信息助手 | 飞书、微信、邮箱消息草稿，发送前确认 |
| 成长助手 | 书单、心理学、逻辑学、经济学、认知成长 |
| 健康助手 | 训练、饮食、作息、体型管理；医疗问题只做常识建议 |
| 维护助手 | 平台接入、队列、桥接、云端、本地、skills/plugins、API 费用 |
| 个人画像助手 | 根据长期任务记录总结你的偏好、风格和工作方式 |

## 安全边界

我可以帮你：

- 打开平台
- 读取你授权可见的页面内容
- 整理数据
- 生成 Word/PPT/Excel/Markdown
- 写邮件/私信草稿
- 做投资观察清单和风险提示
- 更新知识库和历史记录

我不会自动做：

- 读取或保存密码
- 绕过验证码/二次验证
- 真实付款/充值
- 真实交易下单
- 未确认就发送邮件/消息
- 未确认就发布内容
- 未确认就安装未知第三方代码

## 你接下来最值得做的三件事

1. 配置云端搜索和邮件：`ANYSEARCH_API_KEY`、SMTP/邮箱连接器、米促 API 余额接口。
2. 给业务复盘提供数据：把达人沟通表、作品数据表、Kalodata/FastMoss/达秘导出表放进 `inputs/`。
3. 每周让维护助手跑一次：检查入口、队列、平台、云端工作流、skills/plugins、API 余额和输出文件。

## 今日输出文件

- `outputs/daily-brief-2026-06-27-enhanced.md`
- `outputs/business-feedback-2026-06-27-enhanced.md`
- `outputs/maintenance-report-2026-06-27-enhanced.md`
- `outputs/email-draft-daily-brief-2026-06-27-enhanced.md`
- `outputs/email-draft-business-feedback-2026-06-27-enhanced.md`
- `outputs/second-brain-v4-capability-confirmation-and-guide-2026-06-27.md`
