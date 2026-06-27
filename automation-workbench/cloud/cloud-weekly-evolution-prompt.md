# 云端每周自我迭代审计提示词

请执行第二大脑 v4 每周自我迭代审计。

## 输入

读取：

- `automation-workbench/README.md`
- `automation-workbench/app/modules.js`
- `automation-workbench/workflows/second-brain-autonomy-workflow.md`
- `automation-workbench/data/task-history.json`
- `automation-workbench/data/knowledge-items.json`
- `outputs/`

## 任务

1. 复盘过去一周工作台完成了哪些任务。
2. 标记失败任务、低质量交付、重复流程和可以自动化的环节。
3. 审计工作台登记的 skills 和当前 Codex 可用能力是否一致。
4. 搜索可信的 Codex skills、插件、自动化脚本或工作流候选。
5. 输出候选清单：用途、来源链接、维护状态、风险、是否需要账号、是否需要网络、是否建议安装。
6. 同步运行与维护成本：LLM/API/token、GitHub Actions/Codex Cloud、邮件发送、第三方平台订阅、本地开机运行和人工确认时间。
7. 生成下一周工作台升级建议。

## 输出文件

写入：

- `outputs/weekly-evolution-audit-YYYY-MM-DD.md`

追加摘要到：

- `automation-workbench/data/task-history.json`
- `automation-workbench/data/knowledge-items.json`

## 安全边界

只做审计和建议，不自动安装第三方代码，不改账号配置，不发送社交消息，不执行交易。已配置白名单 SMTP 邮件的状态和成本可以被检查并记录。
