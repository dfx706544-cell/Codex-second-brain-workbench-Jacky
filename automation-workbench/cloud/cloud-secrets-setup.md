# 第二大脑 v4 云端密钥配置

目标：让电脑关机后，GitHub Actions / Codex Cloud 也能每天 8 点生成信息简报、业务反馈、维护报告，并在配置完成后发送到 `jacky060911@163.com` 和 `liu13922830178@outlook.com`。

## 先记住边界

- 本地工作台：在你的电脑上运行，能打开夸克、剪映、Excel、本地文件和登录后的平台页面。
- 云端自动化：电脑关机也能运行，但只能访问公网、GitHub 仓库、你放进云端 Secrets 的 API 和邮箱授权。
- 真实平台账号数据：如果只存在你的本机浏览器登录态里，云端在电脑关机时读不到；需要平台 API、导出文件、或开机后同步。
- 密码、验证码、交易密码、支付密码不要发到聊天框，也不要写进仓库文件。

## GitHub Secrets 入口

打开：

```text
https://github.com/dfx706544-cell/Codex-second-brain-workbench-Jacky/settings/secrets/actions
```

路径是：

1. GitHub 仓库
2. Settings
3. Secrets and variables
4. Actions
5. New repository secret

## 米促 API 余额提醒

低于 50 元人民币提醒充值。可用两种方式：

### 方式 A：真实接口自动查询

需要你在米促 API 后台找到“余额查询接口”或“账单/账户信息 API”。

在 GitHub Secrets 里添加：

| 名称 | 用途 |
| --- | --- |
| `MICU_API_BALANCE_URL` | 米促 API 的余额查询地址 |
| `MICU_API_KEY` 或 `MICU_API_TOKEN` | 米促 API 密钥或 token |

如果接口返回字段不是常见字段，再到 Variables 里添加：

| 名称 | 示例 |
| --- | --- |
| `MICU_API_BALANCE_JSON_PATH` | `data.balance` 或 `data.remaining_cny` |
| `MICU_API_LOW_BALANCE_CNY` | `50` |
| `MICU_API_AUTH_HEADER` | 默认 `Authorization` |
| `MICU_API_AUTH_SCHEME` | 默认 `Bearer` |

### 方式 B：人工核实快照

如果米促暂时没有余额查询接口，可以先手动填一个经过你确认的余额：

| 名称 | 示例 |
| --- | --- |
| `MICU_API_BALANCE_CNY` | `42.5` |

这种方式能触发低余额提醒，但不是实时自动读取；充值或消费后需要更新这个值。

当前我已在你的夸克里看到米醋 API 后台，充值账单页可见“当前余额 ¥87.20”（2026-06-27 手动观察）。这说明平台入口真实可打开；但这只是人工观察，不等于云端已能自动查询。

## 163 邮箱发送

每日会分两封邮件：

- 信息简报
- 业务反馈

在 GitHub Secrets 里添加：

| 名称 | 推荐值 |
| --- | --- |
| `SMTP_HOST` | `smtp.163.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `jacky060911@163.com` |
| `SMTP_PASS` | 163 邮箱的 SMTP 授权码，不是邮箱登录密码 |
| `MAIL_FROM` | `jacky060911@163.com` |
| `MAIL_TO` | `jacky060911@163.com,liu13922830178@outlook.com` |

在 GitHub Variables 里添加：

| 名称 | 值 |
| --- | --- |
| `SMTP_SECURE` | `true` |
| `SEND_EMAIL` | `true` |

如果 `SEND_EMAIL` 不是 `true`，系统只会生成邮件草稿，不会真实发送。

## AnySearch

如果要让每日简报联网检索，可添加：

| 名称 | 用途 |
| --- | --- |
| `ANYSEARCH_API_KEY` | AnySearch API Key |

当前 runner 已预留环境变量，后续可以继续把实时搜索写进每日简报生成逻辑。

## 飞书备用交付

如果 GitHub Actions 云端无法连接 163 SMTP，可以用飞书自定义机器人作为备用交付通道。它会在邮件失败时，把今日简报入口、业务反馈入口和维护状态推送到飞书。

在 GitHub Secrets 里添加：

| 名称 | 用途 |
| --- | --- |
| `FEISHU_WEBHOOK_URL` | 飞书群自定义机器人的 Webhook 地址 |
| `FEISHU_WEBHOOK_SECRET` | 可选；如果飞书机器人开启签名校验，就填写签名密钥 |

在 GitHub Variables 里可选添加：

| 名称 | 值 |
| --- | --- |
| `SEND_FEISHU` | `true` 开启，`false` 关闭；不填时默认开启备用交付 |

飞书机器人创建路径：

1. 打开飞书。
2. 新建或选择一个只给你自己的群。
3. 群设置。
4. 群机器人。
5. 添加机器人。
6. 选择“自定义机器人”。
7. 复制 Webhook 地址，填入 GitHub Secret `FEISHU_WEBHOOK_URL`。
8. 如果开启“签名校验”，把签名密钥填入 `FEISHU_WEBHOOK_SECRET`。

注意：Webhook 属于敏感地址，不要发到聊天框、不要写入仓库文件，只放到 GitHub Secrets。

## 手动测试云端任务

进入 GitHub 仓库：

1. Actions
2. Second Brain Daily Draft
3. Run workflow

运行后检查：

- `outputs/daily-brief-日期.md`
- `outputs/business-feedback-日期.md`
- `outputs/email-draft-daily-brief-日期.md`
- `outputs/email-draft-business-feedback-日期.md`
- `outputs/maintenance-report-日期.md`
- `automation-workbench/data/*.json`

## 常见状态解释

- `余额监控未配置/待授权`：没有找到米促 API 余额接口或密钥。
- `需要充值`：已核实余额低于 50 元。
- `草稿模式`：没有配置 SMTP，或 `SEND_EMAIL` 没开。
- `已发送`：SMTP 配置可用，并且两封邮件发送成功。
- `发送失败`：SMTP 配置存在，但授权码、端口或邮箱安全设置可能不对。
