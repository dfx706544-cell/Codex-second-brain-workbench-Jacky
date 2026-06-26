# Skill Scout 工作台接入计划

状态：等待用户确认安装候选后执行。

## 拟安装后新增 skill 选项

建议在 `automation-workbench/app/modules.js` 的 `WORKBENCH_SKILLS` 增加：

```js
{ id: "playwright", name: "playwright", defaultModules: ["work", "inbox", "analytics", "creator"] },
{ id: "playwright-interactive", name: "playwright-interactive", defaultModules: ["work", "creator", "skills"] },
{ id: "docx-win", name: "docx-win", defaultModules: ["office"] },
{ id: "pptx-win", name: "pptx-win", defaultModules: ["office"] },
{ id: "xlsx-win", name: "xlsx-win", defaultModules: ["office", "analytics"] },
{ id: "office-pdf", name: "office-pdf", defaultModules: ["office", "delivery", "news"] },
{ id: "office-motion", name: "office-motion", defaultModules: ["creator", "office"] },
{ id: "email-draft-polish", name: "email-draft-polish", defaultModules: ["inbox", "delivery"] },
{ id: "connect", name: "connect", defaultModules: [] },
{ id: "serenity-alpha", name: "serenity-alpha", defaultModules: ["trading", "news"] }
```

## 安全默认值

- `connect` 不默认勾选，因为它可能连接外部 app 并执行真实动作。
- 金融类 skill 只用于资讯、研究、纸面交易和提醒，不接入真实下单。
- 邮件/社交类 skill 只生成草稿，发送前仍需用户确认。
- Windows Office COM 类 skill 只在用户本机桌面 Office 可用时启用。

## 验证步骤

1. 安装后重启 Codex。
2. 打开工作台，确认 skill 列表出现新增项。
3. 新建一个 Office 测试任务，确认 `docx-win`、`pptx-win`、`xlsx-win` 只在 Office 助手默认勾选。
4. 新建一个金融资讯任务，确认 `serenity-alpha` 被路由到金融助手/资讯助手。
5. 新建一个邮件草稿任务，确认 `email-draft-polish` 出现在信息助手/交付助手。
6. 不测试真实发送、真实交易、真实账号授权。
