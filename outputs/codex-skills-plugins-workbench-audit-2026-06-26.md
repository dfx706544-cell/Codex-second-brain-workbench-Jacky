# Codex Skills / Plugins 与自动化工作台审计报告

生成时间：2026-06-26  
工作区：`C:\Users\嘉十一\Documents\Codex\2026-06-24\w`

## 一句话结论

你的工作台已经具备“本地第二大脑驾驶舱”的雏形：能排队、选助手、选平台、沉淀知识库、历史记录、每日交付和个人画像。Codex 这边已经有每日 8 点后台任务和每周自我迭代审计任务。真正的“电脑关机后还继续跑”，目前还没有完成，因为当前只看到本机本地项目，没有看到已接入的远程/云端项目。

## 最直白解释

本地化：东西放在你这台电脑上。优点是文件在本机、可控、能打开 Excel/Word/剪映/浏览器；缺点是电脑关机、睡眠、断网后，本地工作台就不能继续跑。

自动化：到时间或收到任务后自动执行。它可以在本机执行，也可以在云端执行。本机自动化仍然怕关机；云端自动化才能做到你电脑没开机也继续查资料、整理简报。

工作台：像一个驾驶舱和数据库。它负责让你输入需求、选择助手/平台/能力，展示知识库、历史记录、每日交付和个人画像。它本身不是大模型，也不会自己理解复杂任务，真正的理解和执行仍靠 Codex。

我：我是执行大脑。你在这里说需求，我能读项目、改工作台、打开网页/应用、生成文件、调用 skills，并把结果写回 `outputs/` 和 `automation-workbench/data/`。

Skill：像一本专项操作手册。比如 spreadsheets 教我怎么认真做 Excel，anysearch 教我怎么做实时搜索，xlsx-win 教我怎么用 Windows Excel。

Plugin：像一个安装包。它可以包含一个或多个 skills，也可以带浏览器、桌面控制、MCP 工具或应用集成。

记忆能力：当前由四部分组成：这个聊天线程的上下文、`automation-workbench/data/personal-profile.json`、知识库 `knowledge-items.json`、历史记录 `task-history.json`。如果换线程或清空数据，记忆就会变弱；所以重要长期信息要沉淀进数据文件。

## 关机后运行能力

当前状态：本机工作台和本机 Codex 项目自动化都需要电脑开机、Codex 可用、项目文件还在。

已发现的官方边界：项目级自动化运行时，本机 Codex App 需要开机运行，项目也需要在磁盘上可用。

要实现真正关机后仍运行，需要接入其中一种常久在线层：

- Codex 远程/云端项目：推荐优先路线，最贴近你现在的工作方式。
- VPS：适合稳定跑爬取、数据库、邮件发送器和任务调度。
- NAS：适合个人长期在线存储和定时任务。
- 云函数：适合轻量抓取和定时推送。

建议路线：先把本地工作台继续作为前台驾驶舱，再接一个远程/云端执行层。云端负责每日收集和生成结果；你电脑开机后，本地工作台同步前一晚的知识库和交付结果。

## Codex 自动化状态

| 自动化 | 类型 | 时间 | 状态 | 作用 |
| --- | --- | --- | --- | --- |
| `automation` | heartbeat | 每天 8:00 | ACTIVE | 在当前线程生成每日简报与业务反馈，适合保留对话上下文 |
| `v4` | cron | 每天 8:00 | ACTIVE | 在项目里生成每日后台交付，写入 `outputs/` 和 `automation-workbench/data/` |
| `v4-2` | cron | 每周一 9:30 | ACTIVE | 审计工作台、skills/plugins、失败记录和自我迭代候选 |

## 已启用插件

| 插件 | 状态 | 用途 |
| --- | --- | --- |
| `browser@openai-bundled` | enabled | 控制 Codex 内置浏览器，适合本地工作台和网页测试 |
| `chrome@openai-bundled` | enabled | 控制你的 Chrome 状态，适合已登录网站，但不读取密码 |
| `computer-use@openai-bundled` | enabled | 控制 Windows 桌面应用，适合剪映、Office 等前台任务 |
| `documents@openai-primary-runtime` | enabled | 生成和编辑 Word/docx 文档 |
| `spreadsheets@openai-primary-runtime` | enabled | 生成和编辑 Excel/csv/xlsx 表格 |
| `presentations@openai-primary-runtime` | enabled | 生成和编辑 PPT/pptx |
| `pdf@openai-primary-runtime` | enabled | 读取、生成、验证 PDF |
| `template-creator@openai-primary-runtime` | enabled | 从 Office 文件制作可复用模板 skill |
| `superpowers@openai-api-curated` | enabled | 规划、测试、调试、代码审查等开发流程 |

## 当前 Codex 可用 skills

### 系统和安装类

- `imagegen`
- `openai-docs`
- `plugin-creator`
- `skill-creator`
- `skill-installer`

### 你已安装或 GitHub 安装的本地 skills

- `anysearch`
- `connect`
- `docx-win`
- `email-draft-polish`
- `office-motion`
- `office-pdf`
- `playwright`
- `playwright-interactive`
- `pptx-win`
- `serenity-alpha`
- `xlsx-win`

### 插件提供的 skills

- `browser:control-in-app-browser`
- `chrome:control-chrome`
- `computer-use:computer-use`
- `documents:documents`
- `pdf:pdf`
- `presentations:Presentations`
- `spreadsheets:Spreadsheets`
- `template-creator:template-creator`
- `superpowers:*`

## 工作台 skill 清单同步状态

我已把这些当前可用能力补进工作台的 skill 选择区：

- `chrome`
- `computer-use`
- `openai-docs`
- `imagegen`
- `plugin-creator`
- `skill-creator`
- `template-creator`

仍需注意：工作台里显示某个 skill，不等于网页自己会执行这个 skill。它只是把任务说明写得更准确；真正调用 skill 的仍是 Codex。

## 能否在 Codex 和工作台都正常使用

Codex 中：大部分可以。上述 skills/plugins 已在当前会话的可用能力列表或本机配置中出现。本次验证时，`browser` 内置浏览器插件已启用，但直接连接内置浏览器时出现一次运行时资源路径报错：`failed to write kernel assets`。这不影响工作台文件和本地桥接服务；如后续需要我直接控制 Codex 内置浏览器，建议先重启 Codex 或改用 Chrome/Computer Use 作为替代。

工作台中：可以作为任务路由和提示词能力使用。工作台会把你选择的 skill 写进任务队列，Codex 处理队列时再真正调用。

桌面 App/浏览器中：需要分情况。Chrome、Computer Use、剪映、Office 这类前台操作要求电脑开机、桌面可用、页面可见，并且登录/验证码由你亲自处理。

关机后：本地 skills/plugins 不能在关机电脑上运行。需要远程主机或云端环境安装同样的 skills/plugins，才能让后台继续工作。

## 安全边界

可以默认自主执行：

- 搜集公开资讯。
- 整理信息简报。
- 生成业务反馈。
- 更新知识库。
- 生成邮件草稿。
- 生成自我迭代候选清单。

必须当次确认：

- 发送邮件、微信、飞书、私信或社交消息。
- 上传、提交、发布、下单、支付。
- 真实金融交易。
- 安装第三方 skill/plugin/软件。
- 使用或保存密码、验证码、支付码、交易密码。

## 下一步建议

1. 打开 Codex 的远程连接或云端项目能力，确认是否能添加一个常久在线执行环境。
2. 为 `jacky060911@163.com` 配置安全邮件发送方式；在配置前只生成草稿。
3. 为账号复盘准备平台导出字段，例如作品 ID、发布时间、播放量、完播率、互动率、转化、私信数、达人回复率和成交状态。
4. 每周一查看 `v4-2` 的自我迭代审计报告，再决定是否安装新的 skill/plugin。

## 本次验证记录

- `automation-workbench/app/modules.js` 语法检查通过。
- `automation-workbench/scripts/workbench-config.test.mjs` 通过：4/4。
- `automation-workbench/scripts/workbench-bridge.test.mjs` 通过：7/7。
- `automation-workbench/data/task-history.json` 和 `knowledge-items.json` JSON 解析通过。
- 本地桥接服务 `/api/health` 返回 200。
- 工作台页面 `/automation-workbench/app/` 返回 200，并能读取到“第二大脑自动化工作台”和 v4 标识。
- 工作台 `modules.js` 已能读取到新增能力：`chrome`、`computer-use`、`openai-docs`、`plugin-creator`、`template-creator`。
