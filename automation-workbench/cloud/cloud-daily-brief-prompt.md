# 云端每日 8 点信息简报与业务反馈提示词

请执行第二大脑 v4 每日后台任务。

## 输入

优先读取：

- `automation-workbench/README.md`
- `automation-workbench/workflows/second-brain-autonomy-workflow.md`
- `automation-workbench/config/settings.json`
- `automation-workbench/config/watchlists.json`
- `automation-workbench/data/personal-profile.json`
- `automation-workbench/data/knowledge-items.json`
- `automation-workbench/data/task-history.json`

## 任务

每天 8 点生成两份交付：

1. 信息简报
2. 业务反馈与账号复盘建议

## 覆盖范围

- 美股
- 港股
- 与股票涨跌强相关的新闻催化
- 宏观政策
- 时政新闻
- 社会热点
- 跨境电商
- TikTok Shop 机会
- Kalodata / FastMoss 可辅助观察的数据思路
- AI 行业
- AI 技术最新发展：模型、Agent、多模态、开源模型、AI 芯片、基础设施、监管、安全和可落地工具
- 创作者经济
- 个人 IP
- TikTok、YouTube、Instagram、抖音、微信视频号、小红书的平台玩法、热点、算法或推荐机制变化
- 个人成长、心理学、逻辑学、经济金融、社交公关、健康管理的高质量新资料

## 输出要求

- 无论来源是中文还是英文，解读都用通俗中文。
- 同时覆盖中国大陆和海外信息源。
- 每条重要信息保留真实可查询来源链接。
- 不编造数据和来源。
- 无法核实的信息标注“待核实”。
- 固定加入“AI 技术最新发展”“预计任务执行成本”“API/token 费用提醒”和“运行与维护成本”。

## 关机后云端信息源边界

电脑关机后，本任务只能使用云端可访问的信息源：

- 公开网页与新闻页
- RSS feeds
- AnySearch 或其他搜索 API
- 金融市场数据 API
- 官方公告、财报、SEC、HKEXnews 等披露
- 官方平台博客、帮助中心、开发者文档
- 公开趋势页或公开视频/账号页
- 学术元数据 API
- GitHub 仓库数据
- 已授权的邮箱 API 与飞书 API

不要声称云端能读取本机夸克浏览器登录态、微信、飞书客户端、剪映、Kalodata/FastMoss/达秘/TikClubs 私有后台、抖音/小红书/视频号账号后台。上述内容只能在电脑开机、用户已登录、页面可见、或用户导出 CSV/Excel/截图到 inputs/ 后，由本地工作台补采。

## 开机后本地补采命令

如果今日云端简报或业务反馈因为关机无法读取账号后台，请在维护报告中加入下一步命令：

```text
开机后本地平台补采：请打开无垠工作台，读取已登录平台或 inputs/ 导出文件，补齐 Kalodata、FastMoss、达秘 / TikClubs、TikTok、抖音、小红书、视频号、YouTube、Instagram、飞书、163 邮箱和剪映相关的后台数据、作品数据、达人沟通、询盘、转化、变现和来源链接；生成 outputs/boot-backfill-YYYY-MM-DD.md，并更新 automation-workbench/data/knowledge-items.json、business-feedback.json、task-history.json。
```

## 写入文件

把完整结果写入：

- `outputs/daily-brief-YYYY-MM-DD.md`
- `outputs/business-feedback-YYYY-MM-DD.md`
- `outputs/email-draft-daily-brief-YYYY-MM-DD.md`
- `outputs/email-draft-business-feedback-YYYY-MM-DD.md`

追加摘要索引到：

- `automation-workbench/data/daily-briefs.json`
- `automation-workbench/data/business-feedback.json`
- `automation-workbench/data/knowledge-items.json`
- `automation-workbench/data/task-history.json`

## 邮件

收件人：`jacky060911@163.com, liu13922830178@outlook.com`

如果 SMTP Secrets、`SEND_EMAIL=true` 和白名单收件人已配置，可自动发送信息简报和业务反馈到上述邮箱；如果发送失败或配置缺失，保留草稿并记录原因。

## 禁止动作

- 不发送社交消息
- 不上传、提交、发布
- 不执行真实金融交易
- 不支付或下单
- 不处理密码、验证码、支付码、交易密码
- 不自动安装第三方 skill/plugin/软件
