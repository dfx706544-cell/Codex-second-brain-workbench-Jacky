# 无垠第二大脑工作台审计报告与使用指南

生成时间：2026-06-27 19:20 Asia/Shanghai

## 结论

无垠工作台的本地前端、共享队列、平台打开入口、数据中心、每日/每周云端 runner、公开模板、邮件发送器、API 余额提醒、Obsidian 导出器和费用同步逻辑已经完成并通过本地测试。

不能说满的部分：第三方平台账号内数据、真实邮件长期送达率、GitHub Actions 每天实际触发成功率、米促 API 真实余额接口、社交平台外发、真实交易/支付、官方 Record & Replay 录制能力，仍需要对应平台登录态、Secrets、云端运行记录或产品环境支持。

## 已验证

| 项目 | 状态 | 证据 |
| --- | --- | --- |
| 本地工作台 | 已通过 | `http://127.0.0.1:8800/automation-workbench/app/` 返回 200，页面含“无垠”和“一键复制我的工作台” |
| 桌面快捷方式 | 已通过 | `C:\Users\嘉十一\Desktop\无垠第二大脑工作台.lnk` 指向 `start-workbench-desktop.ps1` |
| 共享队列/桥接 | 已通过 | `/api/health` 返回 `dataHub`、`operationsCenter`、`sharedQueue`、`platformOpener` |
| 平台入口 | 已通过入口级检查 | `/api/platforms` 返回 Kalodata、FastMoss、达秘/TikClubs、飞书、微信、163 邮箱、TikTok、YouTube、Instagram、抖音、视频号、小红书、SEC、HKEXnews、GitHub、Google Scholar、Obsidian |
| 云端就绪 | 已通过 | `check-cloud-readiness` 为 15/15 |
| 自动化测试 | 已通过 | Node 测试 45/45；新增 Obsidian 导出测试 1/1 |
| 公开模板 | 已通过 | GitHub Pages 链接 200；隐私扫描未发现个人邮箱、本地路径、私有仓库名、历史记录或 outputs |
| Obsidian | 已安装并接入 | `C:\Users\嘉十一\AppData\Local\Programs\Obsidian\Obsidian.exe`；已导出 `automation-workbench/obsidian-vault/` |

## 功能路径

自然语言任务：

1. 工作台输入需求。
2. 加入执行队列。
3. 队列写入 `automation-workbench/queue/tasks.json`。
4. 复制执行口令发给 Codex，或直接让我处理队列。
5. Codex 读取 `settings.json`、`workflows/`、`inputs/`、`templates/`。
6. 按任务调用对应 skill、平台、Office、搜索或本地脚本。
7. 输出到 `outputs/`，并更新 `automation-workbench/data/`。

平台打开：

1. 工作台来源卡片点击“打开”。
2. 前端调用 `/api/platforms/open`。
3. bridge 优先用夸克打开网页平台。
4. 对 Obsidian 这类本地工具，bridge 调用 `appPath` 打开本机程序。
5. 如遇登录、验证码、二次验证、支付或交易确认，由你本人操作。

每日后台：

1. GitHub Actions `.github/workflows/second-brain-daily.yml` 每天 08:00 中国时间触发。
2. 执行 `second-brain-cloud-runner.mjs daily`。
3. 生成信息简报、业务反馈、维护报告、两封邮件正文。
4. 若 SMTP Secrets 和 `SEND_EMAIL=true` 可用，发送到 `jacky060911@163.com` 和 `liu13922830178@outlook.com`。
5. 结果提交到私有仓库；本地开机后拉取即可同步到工作台。

每周维护：

1. `.github/workflows/second-brain-weekly.yml` 每周一 09:30 中国时间触发。
2. 执行 `second-brain-cloud-runner.mjs weekly`。
3. 检查历史任务、失败记录、skills/plugins、平台入口、费用和下一步改进。

复制给朋友：

1. 工作台右上角点击“一键复制我的工作台”。
2. 分享公开模板链接：`https://dfx706544-cell.github.io/wuyin-second-brain-workbench-template/automation-workbench/app/`
3. 朋友拿到的是干净模板，不包含你的历史记录、outputs、队列、Secrets、本地路径或账号权限。
4. 朋友若要真正后台自动化，需要配置他们自己的仓库、API、邮箱、平台登录和本地部署。

Obsidian：

1. 运行 `node automation-workbench/scripts/export-obsidian-vault.mjs --out automation-workbench/obsidian-vault`。
2. 打开 Obsidian。
3. 选择本地库 `C:\Users\嘉十一\Documents\Codex\2026-06-24\w\automation-workbench\obsidian-vault`。
4. 查看 Knowledge、Daily Briefs、Business Feedback、Task History。

## Recorder / Record & Replay

你说的 recorder 对应的是 Codex 官方 **Record & Replay**，不是 Record and Reply。根据 Codex 官方手册，Record & Replay 当前可用于 macOS，并需要 Computer Use 可用和启用。当前这台 Windows 机器上不能把它当成普通插件安装使用。

替代方案已经具备：把重复流程沉淀为 workflow、执行口令、任务历史和 Codex skill。后续如果你换到支持 Record & Replay 的 macOS 环境，可以再用官方录制能力把流程录成 skill。

## 成本口径

以后每次任务我会先给预计人民币成本：

- 本地脚本、读写文件、打开工作台：通常 0 元。
- LLM/API/token：按米促 API、OpenAI/Codex、AnySearch 或其他模型服务真实账单核算。
- GitHub Actions/Codex Cloud：免费额度内通常 0 元，超出以账单为准。
- 163 SMTP：白名单邮件通常不另收发送费，但要监控失败率和频率限制。
- 第三方平台：Kalodata、FastMoss、达秘/TikClubs、剪映、金融/数据源订阅按各自套餐核算。

日报/周报会固定同步“已核实费用、待核实费用、余额是否低于 50 元、下一次任务预计成本”。

## 当前限制

- 关机后本地工作台不能运行；关机后自动化依赖 GitHub Actions、Codex Cloud、VPS、NAS 或其他常久在线执行层。
- 平台“已接入”目前指入口可打开；账号内数据读取仍依赖登录态、API 或导出文件。
- 邮件可直发，但真实送达率要看 GitHub Actions 日志、SMTP 授权码和邮箱策略。
- 金融只做资讯、提醒、纸面交易、风险清单和人工确认前检查，不执行真实下单。
- 不保存或绕过密码、验证码、二次验证、支付码、交易密码。

## 常用命令

打开工作台：

```powershell
powershell -ExecutionPolicy Bypass -File automation-workbench/scripts/open-workbench.ps1
```

每日 runner：

```powershell
node automation-workbench/scripts/second-brain-cloud-runner.mjs daily
```

每周审计：

```powershell
node automation-workbench/scripts/second-brain-cloud-runner.mjs weekly
```

导出 Obsidian：

```powershell
node automation-workbench/scripts/export-obsidian-vault.mjs --out automation-workbench/obsidian-vault
```

云端就绪检查：

```powershell
node automation-workbench/scripts/check-cloud-readiness.mjs
```
