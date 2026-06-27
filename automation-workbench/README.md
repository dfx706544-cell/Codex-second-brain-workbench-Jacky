# 第二大脑自动化工作台 v4

这是一个本地第二大脑自动化工作台，用来把自然语言需求整理成 Codex 可执行任务，并管理 Office、资讯、金融、电商、社交信息、交付、账号数据复盘、自媒体/IP、个人成长、健康管理、个人画像和 skill 扩展工作流。

## 入口

推荐使用脚本打开。它会先启动本地共享队列服务，再打开工作台页面：

```powershell
powershell -ExecutionPolicy Bypass -File "automation-workbench\scripts\open-workbench.ps1"
```

打开后地址一般是：

```text
http://127.0.0.1:8787/automation-workbench/app/
```

如果 8787 被占用，脚本会自动换到 8788 或后续端口，并打开正确页面。

备用方式：

```text
automation-workbench/app/index.html
```

备用方式只能在浏览器本地保存队列；如果页面里显示“本地备份模式”，Codex 可能无法直接读取任务。

## 共享队列

新版工作台会把执行队列保存到：

```text
automation-workbench/queue/tasks.json
```

当页面显示“共享队列已连接”时，你在工作台里点击“加入执行队列”，Codex 就能读取这个文件并执行最新任务。

如果你之前已经在旧页面加入过队列，但 Codex 看不到，请先运行 `open-workbench.ps1`，再刷新旧页面或重新打开工作台。页面会尝试把旧浏览器里的队列迁移到共享队列文件。

## 当前工作方式

1. 在工作台输入需求。
2. 选择助手、平台、能力、交付方式。
3. 点击“加入执行队列”。
4. 确认队列区域显示“共享队列已连接”。
5. 回到 Codex 聊天，说“处理工作台任务队列”，或复制全部任务发给 Codex。
6. Codex 执行搜索、打开网站、生成 Office 文件、整理草稿或复盘报告。

## 助手

- Office 助手：Word、PPT、Excel。
- 资讯助手：中外信息源、中文解读、来源链接、日报简报。
- 金融助手：美股、港股、短线提醒、纸面交易、长期研究。
- 电商助手：Kalodata、FastMoss、达人、询盘、竞品、沟通跟进。
- 信息助手：飞书、微信、邮箱、社媒私信，先生成回复草稿。
- 交付助手：邮件草稿、附件、报表、发送前确认。
- 账号数据复盘：作品流量、达人沟通、变现、转化和优化建议。
- 自媒体/IP 助手：定位、选题、脚本、剪辑、发布、变现。
- Skill Scout：搜索和评估新 skills，安装前确认具体候选。

## 已安装扩展 skills

2026-06-25 已安装并接入工作台的扩展：

- `playwright`、`playwright-interactive`：增强网页和本地应用自动化。
- `docx-win`、`pptx-win`、`xlsx-win`：Windows 桌面版 Word、PowerPoint、Excel 自动化。
- `office-pdf`、`office-motion`：PDF 和动效/视频/GIF 辅助。
- `chrome`、`computer-use`：使用 Chrome 登录态和 Windows 桌面应用前台操作。
- `openai-docs`、`imagegen`、`template-creator`：OpenAI/Codex 文档查询、图片生成和 Office 模板创建。
- `skill-creator`、`plugin-creator`：创建新的 Codex skills 或插件。
- `email-draft-polish`：邮件草稿润色。
- `connect`：连接外部 app 的高级能力，默认不自动勾选。
- `serenity-alpha`：把市场新闻转成可验证的投资研究假设。

## 安全边界

- 不读取浏览器保存的密码。
- 不要求用户把账号密码发到聊天框。
- 不绕过登录、验证码、付费墙或授权限制。
- 微信、飞书、邮件、私信等外发动作默认只生成草稿。
- `connect` 类能力可能执行真实外部动作，必须在当次任务中明确确认目标平台、账号和发送/提交内容后才能使用。
- 发送、上传、提交、安装、支付、交易前必须由用户确认。
- 金融助手不执行真实下单。

## 每日简报

默认目标：每天早上 8 点生成中文简报、结构化报表和邮件草稿，收件邮箱为 `jacky060911@163.com`。

如果没有安全邮件发送配置，工作台只生成邮件草稿和附件，不直接发送。

如果云端已经配置 SMTP Secrets、`SEND_EMAIL=true` 和白名单收件人，GitHub Actions/Codex Cloud runner 可自动发送两封邮件到你的邮箱：

- 信息简报
- 业务反馈

微信、飞书、社交私信、上传、发布、交易、支付和安装第三方代码仍然需要当次确认。

## 第二大脑 v4

v4 采用数据中枢路线。核心数据保存在 `automation-workbench/data/`：

- 知识库：`knowledge-items.json`
- 历史记录：`task-history.json`
- 信息简报：`daily-briefs.json`
- 业务反馈：`business-feedback.json`
- 个人画像：`personal-profile.json`
- 健康记录：`health-log.json`
- 成长资料库：`growth-library.json`

打开工作台后可以切换“知识库”“历史记录”“每日交付”“个人画像”等栏目。知识库用于查看来源、收录时间、发行时间和行动建议；历史记录用于回看工作台完成过的任务；每日交付会把信息简报和业务反馈拆成两份邮件草稿。

新增助手：

- 个人成长助手：心理学、逻辑学、经济金融、社交公关、书单和练习计划。
- 健康助手：训练、饮食、作息、身材管理和习惯复盘；不做医疗诊断。
- 个人画像助手：记录你确认过的目标、偏好、约束和工作方式。

默认只生成草稿、报表和附件。邮件发送、社交平台回复、上传、提交、安装、真实交易等动作仍然需要你在当次任务中明确确认。

## Obsidian 知识库

已支持把工作台数据导出为 Obsidian 可打开的 Markdown 笔记库：

```powershell
node automation-workbench/scripts/export-obsidian-vault.mjs --out automation-workbench/obsidian-vault
```

默认导出：

- `Knowledge/`：知识库条目。
- `Daily Briefs/`：每日信息简报索引。
- `Business Feedback/`：业务反馈索引。
- `Task History/`：任务历史记录。

导出的 `automation-workbench/obsidian-vault/` 是本地个人数据，已加入 `.gitignore`，不进入公开模板。

## 成本口径

之后每次任务执行前或执行开始时，默认给出人民币成本口径：

- 本地脚本、打开工作台、整理本地文件：通常 0 元人民币。
- LLM/API/token、AnySearch、米促 API、OpenAI/Codex：按实际调用和账单核算；无法读取账单时标注待核实。
- GitHub Actions/Codex Cloud：免费额度内通常 0 元，超出按 GitHub/OpenAI 账单核算。
- 163 SMTP：发送白名单邮件通常不另收 SMTP 费用，但需要监控发送失败和邮箱限制。
- Kalodata、FastMoss、达秘/TikClubs、剪映等第三方平台：按各自订阅套餐独立核算。

每日/每周维护反馈会同步“已核实费用、待核实费用、余额是否低于 50 元、下一次任务预计成本”。

## 真正自动化与关机后运行

工作台本身是本地驾驶舱：负责展示知识库、历史记录、每日交付和个人画像。只要电脑关机，本地网页、本地桥接服务和本地文件写入都无法继续运行。

要实现“电脑没开机也自动查询资讯、整理知识库、生成简报与业务反馈”，需要把执行层放到 Codex 自动化、远程工作区、VPS、NAS 或云函数上。当前已采用的路线是：本地工作台负责沉淀和展示，Codex 自动化负责定时唤醒并产出每日结果。

当前推荐的真正后台化路线是 `Codex Cloud + GitHub 私有仓库`：云端负责每天生成结果并提交到仓库，本地电脑开机后同步仓库，工作台读取最新 `automation-workbench/data/` 和 `outputs/`。云端接入包见 `automation-workbench/cloud/`。

默认可自主执行：

- 搜集公开资讯。
- 整理信息简报。
- 生成业务反馈建议。
- 更新知识库条目。
- 生成邮件草稿。
- 生成自我迭代候选清单。

默认必须确认：

- 发送邮件或社交消息。
- 上传、提交、发布、安装。
- 真实交易、支付、下单。
- 处理密码、验证码、支付码、交易密码。

更完整的运行规则见 `automation-workbench/workflows/second-brain-autonomy-workflow.md`。

当前已经配置了三个 Codex 自动化：

- `automation`：每天 8 点唤醒当前线程，生成信息简报和业务反馈草稿。
- `v4`：每天 8 点在项目里执行后台交付，尽量写入 `outputs/` 和 `automation-workbench/data/`。
- `v4-2`：每周一 9:30 做自我迭代审计，检查 skills/plugins、失败记录和改进候选；只做建议，不自动安装。

本地工作台和 Codex 自动化的详细审计见 `outputs/codex-skills-plugins-workbench-audit-2026-06-26.md`。

Codex Cloud 接入步骤见 `automation-workbench/cloud/codex-cloud-setup-checklist.md`。

## 本地桥接服务

桥接服务只监听本机 `127.0.0.1`，用于：

- 提供工作台网页。
- 读写 `automation-workbench/queue/tasks.json`。
- 让 Codex 和工作台看到同一个任务队列。

它不会处理账号密码、验证码、支付码或交易密码。
