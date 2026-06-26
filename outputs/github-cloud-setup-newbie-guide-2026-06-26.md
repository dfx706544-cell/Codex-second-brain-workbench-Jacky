# 第二大脑 v4：GitHub + Codex Cloud 新手接入指南

## 你现在要做什么

目标：让工作台在你电脑关机后，也能通过云端继续生成每日简报、业务反馈和自我迭代报告。

最推荐路线：

```text
本地工作台 -> GitHub 私有仓库 -> Codex Cloud / GitHub Actions -> 本地开机后同步
```

## 第一步：创建 GitHub 私有仓库

1. 打开 `https://github.com/`
2. 登录你的 GitHub。
3. 点击 New repository。
4. 仓库名建议：

```text
second-brain-workbench
```

5. 选择 Private。
6. 不要勾选 Add README、Add .gitignore、Add license。
7. 创建仓库。

## 第二步：连接 Codex Cloud

1. 打开 `https://chatgpt.com/codex`
2. 登录和当前 Codex 相同的账号。
3. 连接 GitHub。
4. 授权访问刚才的私有仓库。
5. 打开 `https://chatgpt.com/codex/settings/environments`
6. 为这个仓库配置云端环境。

## 第三步：处理 Git 不可用

我刚才检查到当前终端里 `git` 命令不可用。

可能原因：

- 电脑没安装 Git。
- Git 安装了，但没有加入 PATH。

你可以让我继续帮你安装 Git。安装 Git 需要联网下载安装程序，属于对电脑的真实软件安装动作，我会在执行前再次说明。

## 第四步：上传工作台

Git 可用后，我会帮你做：

```powershell
git init
git add .
git commit -m "init second brain workbench"
git remote add origin <你的 GitHub 私有仓库地址>
git push -u origin main
```

如果当前 `.git` 已存在，我会先检查状态，不会乱删或重置。

## 不能上传的内容

不要上传：

- 密码
- Cookie
- 验证码
- 支付码
- 交易密码
- 邮箱授权码
- 浏览器缓存
- 私密聊天全文

我已经添加 `.gitignore`，默认排除一部分本地缓存和敏感输入目录。

## 已经准备好的云端文件

- `automation-workbench/scripts/second-brain-cloud-runner.mjs`
- `.github/workflows/second-brain-daily.yml`
- `.github/workflows/second-brain-weekly.yml`
- `automation-workbench/cloud/`

## 当前卡点

- Git 命令不可用。
- GitHub 远程仓库尚未绑定。
- Codex Cloud 需要你本人登录和授权。

## 你完成授权后对我说

```text
我已经连接好 GitHub 和 Codex Cloud，请继续初始化仓库、绑定远程仓库并配置云端每日任务。
```
