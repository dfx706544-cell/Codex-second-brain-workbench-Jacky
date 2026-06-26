# 自动化工作台数据中枢

这个目录是 v4 第二大脑工作台的本地数据层。页面和助手优先读取这里的结构化文件，而不是只依赖零散 Markdown。

## 文件

- `knowledge-items.json`：知识库和数据库条目。
- `task-history.json`：工作台任务历史。
- `daily-briefs.json`：每日信息简报记录。
- `business-feedback.json`：业务反馈和账号复盘记录。
- `personal-profile.json`：个人目标、偏好、约束和工作方式。
- `health-log.json`：健康、训练、饮食、作息和身材管理记录。
- `growth-library.json`：个人成长书单、论文、观点卡和练习记录。

## 安全边界

不要写入密码、验证码、支付码、交易密码、银行卡、身份证或其他敏感凭证。

涉及邮件、社交平台、外部 app、上传、提交和交易的动作，仍然需要用户在当次任务中确认。
