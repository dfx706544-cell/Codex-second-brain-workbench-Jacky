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

## 开机后本地平台补采

当电脑关机期间云端无法读取账号后台、私有平台或桌面软件数据时，开机后执行补采。

补采来源：

- 已登录且用户授权可见的平台页面：Kalodata、FastMoss、达秘 / TikClubs、TikTok、抖音、小红书、视频号、YouTube、Instagram、飞书、163 邮箱。
- 用户导出到 `inputs/` 的 CSV、Excel、截图说明或手动记录。
- 本地软件可见项目：剪映草稿、Office 文件、Obsidian vault。

补采内容：

- 作品播放、曝光、完播、互动、点击、成交、变现。
- 达人触达、回复、有效回复、报价、寄样、成交和话术版本。
- 跨境电商选品、达人、竞品、直播/视频表现和询盘质量。
- 平台后台指标、原始链接、截图/导出文件路径、读取时间和下一步动作。

补采输出：

- `outputs/boot-backfill-YYYY-MM-DD.md`
- `outputs/account-analytics-YYYY-MM-DD.xlsx`
- `automation-workbench/data/knowledge-items.json`
- `automation-workbench/data/business-feedback.json`
- `automation-workbench/data/task-history.json`

安全边界：

- 遇到登录、验证码、二次验证、权限变更、支付、交易、发布、上传或社交外发时停下，让用户确认。
- 不读取或保存密码、Cookie、验证码、支付码、交易密码。
- 无法读取的数据必须标注“待授权/待导出”，不要编造。
