# 云端与本地同步规则

## 推荐同步路线

GitHub 私有仓库作为中间层：

1. 本地工作台代码和数据推送到私有仓库。
2. Codex Cloud 从私有仓库运行每日任务。
3. Codex Cloud 把新增简报、业务反馈、知识库条目和历史记录提交回私有仓库。
4. 电脑开机后，本地拉取最新仓库内容。
5. 工作台自动读取更新后的数据文件。

## 冲突处理

如果本地和云端同时改了同一个 JSON：

- 优先保留两边新增记录。
- 不删除本地记录。
- 冲突无法自动解决时，写入 `outputs/sync-conflict-YYYY-MM-DD.md` 等待人工确认。

## 不同步内容

不要同步：

- 密码
- Cookie
- 验证码
- 支付信息
- 交易密码
- 私密聊天全文
- 未经确认的敏感个人信息

## 可同步内容

可以同步：

- 公开资讯摘要
- 来源链接
- 业务建议
- 邮件草稿
- 任务历史
- 用户确认过的长期偏好
- 非敏感配置

## 开机后本地检查

本地工作台开机后应检查：

- `automation-workbench/data/knowledge-items.json`
- `automation-workbench/data/daily-briefs.json`
- `automation-workbench/data/business-feedback.json`
- `automation-workbench/data/task-history.json`
- `outputs/`

如果发现新文件，就在工作台知识库、历史记录和每日交付页面显示。
