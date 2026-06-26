# Skill Scout 候选评估报告

生成时间：2026-06-25

队列任务：打开 GitHub，下载并安装 10 个最可能用得上的 skills，并接入 Codex 和自动化工作台。

## 执行结论

我已经完成第一阶段：搜索、筛选、评估和生成安装候选清单。

我没有直接安装第三方 skill。原因是工作台的安全边界要求：安装陌生 skill 前必须先说明来源、用途、维护状态、风险和本地目标路径，并等待你针对具体候选确认。这样做可以避免把不明代码、外部账号连接器或会发送邮件/消息的自动化能力静默接入你的 Codex。

候选表已保存：

```text
C:\Users\嘉十一\Documents\Codex\2026-06-24\w\outputs\skill-scout-candidates-2026-06-25.csv
```

## 当前已具备能力

你的 Codex 当前已经有这些关键能力：

- `anysearch`：实时搜索、批量搜索、网页抽取。
- `browser`：控制应用内浏览器，适合本地工作台和网页验证。
- `documents`：生成和编辑 Word/docx。
- `presentations`：生成和编辑 PPT。
- `spreadsheets`：生成和分析 Excel/xlsx。
- `pdf`：读写、检查和渲染 PDF。
- `skill-installer`：从 GitHub 安装 skill。

所以新装 skill 的重点不是重复装 Office 基础能力，而是补足：

- Windows 桌面版 Office 自动化。
- 更强网页自动化。
- 社交/邮件草稿与 app 连接。
- 金融资讯到投资研究假设。
- 内容创作和短视频素材处理。

## 推荐确认安装的 10 个候选

| 优先级 | 候选 | 来源 | 适合模块 | 主要价值 | 风险判断 |
| --- | --- | --- | --- | --- | --- |
| 1 | `playwright` | openai/skills | 工作助手、信息助手、电商助手 | 真实浏览器自动化，适合平台筛选、数据读取和表单流程 | 中 |
| 2 | `playwright-interactive` | openai/skills | 工作台调试、自媒体助手 | 持久化浏览器/Electron 自动化，适合复杂页面调试 | 中 |
| 3 | `docx-win` | dachent/skills | Office 助手 | Windows 原生 Word COM 自动化，格式保真更强 | 高 |
| 4 | `pptx-win` | dachent/skills | Office 助手 | Windows 原生 PowerPoint COM 自动化，适合真实 PPT 渲染导出 | 高 |
| 5 | `xlsx-win` | dachent/skills | Office 助手、复盘助手 | Windows 原生 Excel COM 自动化，适合真实 Excel 计算和图表 | 高 |
| 6 | `office-pdf` | arih04x/office-skills | Office、交付、资讯助手 | PDF 创建、抽取、合并和视觉 QA 补充 | 中高 |
| 7 | `office-motion` | arih04x/office-skills | 自媒体/IP、剪辑、PPT | GIF、短循环、动效素材和视频转换 | 高 |
| 8 | `email-draft-polish` | ComposioHQ/awesome-codex-skills | 信息助手、交付助手 | 商务邮件草稿润色，风险低于真实连接邮箱 | 低中 |
| 9 | `connect` | ComposioHQ/awesome-codex-skills | 信息助手、交付助手 | 可连接 Gmail、Slack、GitHub、Notion 等 app | 高 |
| 10 | `serenity-alpha` | haskaomni/serenity-skill | 金融助手、资讯助手 | 把新闻拆成投资假设、催化、风险和验证路径 | 中 |

## 候补观察

- `buy-side-equity-research-memo`：适合长期投资研究，但可在 `serenity-alpha` 试用后再装。
- `Sniff news opportunity`：方向适合“新闻驱动机会发现”，但本次未能稳定确认具体 skill 路径，暂不建议直接安装。
- `OfficeCLI`：看起来是 AI agent 版 Office 工具链，但不是标准 Codex skill 目录，建议先作为外部工具观察。

## 建议安装命令

确认后，我可以按下面的方式安装。现在不要直接复制运行，等你确认候选后我再执行。

```powershell
# 官方浏览器自动化
python "C:\Users\嘉十一\.codex\skills\.system\skill-installer\scripts\install-skill-from-github.py" --repo openai/skills --path skills/.curated/playwright skills/.curated/playwright-interactive

# Windows Office 桌面自动化
python "C:\Users\嘉十一\.codex\skills\.system\skill-installer\scripts\install-skill-from-github.py" --repo dachent/skills --path docx-win pptx-win xlsx-win

# PDF 与动效补充
python "C:\Users\嘉十一\.codex\skills\.system\skill-installer\scripts\install-skill-from-github.py" --repo arih04x/office-skills --path office-pdf office-motion

# 邮件草稿与 app 连接
python "C:\Users\嘉十一\.codex\skills\.system\skill-installer\scripts\install-skill-from-github.py" --repo ComposioHQ/awesome-codex-skills --path email-draft-polish connect

# 金融新闻到投资假设
python "C:\Users\嘉十一\.codex\skills\.system\skill-installer\scripts\install-skill-from-github.py" --repo haskaomni/serenity-skill --path skills/serenity-alpha
```

注意：你的系统 PATH 里没有 `python`，实际执行时我会使用 Codex bundled Python：

```text
C:\Users\嘉十一\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe
```

## 接入工作台方案

安装后，我建议这样接入：

1. 在 `automation-workbench/app/modules.js` 的 `WORKBENCH_SKILLS` 增加这些 skill 名称。
2. 把 `playwright`、`playwright-interactive` 默认勾选到 `work`、`inbox`、`analytics`、`creator`。
3. 把 `docx-win`、`pptx-win`、`xlsx-win` 默认勾选到 `office`。
4. 把 `email-draft-polish` 默认勾选到 `inbox`、`delivery`。
5. `connect` 不默认勾选，只放在高级连接能力里，因为它可能产生外部动作。
6. 把 `serenity-alpha` 默认勾选到 `trading`、`news`，并继续保持“不真实下单”的边界。

## 需要你确认

请你确认是否安装上面推荐的 10 个候选。

如果你确认，我下一步会：

1. 用 skill-installer 下载并安装这些 skill。
2. 更新工作台的 skill 选项和模块默认勾选。
3. 保存安装记录到 `outputs/`。
4. 提醒你重启 Codex，让新 skills 生效。

安装前我不会执行任何下载/安装命令。
