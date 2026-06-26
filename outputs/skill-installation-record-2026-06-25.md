# Skill 安装记录

安装时间：2026-06-25

## 安装结果

本次已成功安装 10 个 skills：

| Skill | 来源 | 本地路径 | 工作台接入 |
| --- | --- | --- | --- |
| `playwright` | `openai/skills` | `C:\Users\嘉十一\.codex\skills\playwright` | 工作助手、信息助手、账号数据复盘、自媒体/IP |
| `playwright-interactive` | `openai/skills` | `C:\Users\嘉十一\.codex\skills\playwright-interactive` | 工作助手、自媒体/IP、Skill Scout |
| `docx-win` | `dachent/skills` | `C:\Users\嘉十一\.codex\skills\docx-win` | Office 助手 |
| `pptx-win` | `dachent/skills` | `C:\Users\嘉十一\.codex\skills\pptx-win` | Office 助手 |
| `xlsx-win` | `dachent/skills` | `C:\Users\嘉十一\.codex\skills\xlsx-win` | Office 助手、账号数据复盘 |
| `office-pdf` | `arih04x/office-skills` | `C:\Users\嘉十一\.codex\skills\office-pdf` | Office、交付、资讯 |
| `office-motion` | `arih04x/office-skills` | `C:\Users\嘉十一\.codex\skills\office-motion` | 自媒体/IP、Office |
| `email-draft-polish` | `ComposioHQ/awesome-codex-skills` | `C:\Users\嘉十一\.codex\skills\email-draft-polish` | 信息助手、交付助手 |
| `connect` | `ComposioHQ/awesome-codex-skills` | `C:\Users\嘉十一\.codex\skills\connect` | 已接入 skill 列表，但默认不勾选 |
| `serenity-alpha` | `haskaomni/serenity-skill` | `C:\Users\嘉十一\.codex\skills\serenity-alpha` | 金融助手、资讯助手 |

## 已修改工作台文件

```text
C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\app\modules.js
C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\README.md
```

## 安全说明

- `connect` 能连接 Gmail、Slack、GitHub、Notion 等外部 app，并可能执行真实发送、创建、发布或更新动作。
- 工作台中 `connect` 默认不勾选。使用它前，需要你在当次任务中明确确认平台、账号、动作和内容。
- 金融类 `serenity-alpha` 只用于研究、资讯、纸面交易和提醒，不执行真实下单。
- Windows Office 类 skills 需要本机安装对应 Office 桌面版，并可能打开本地应用窗口。

## 重要提醒

安装后需要重启 Codex，新的 skills 才会完整出现在后续会话的可用 skill 列表里。
