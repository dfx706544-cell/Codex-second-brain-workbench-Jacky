# 桌面快捷方式与平台接入修复报告

生成时间：2026-06-27

## 本次问题

桌面快捷方式打开后页面空白或打开到旧入口。根因不是工作台前端损坏，而是本机残留了多个旧版 bridge 服务，占用了 `8787` 到 `8799` 等端口；旧服务能返回页面，但不具备新的 `platformOpener` 平台打开能力。启动脚本原先还依赖 Windows TCP 监听表判断端口，在当前权限环境下可能判断失败。

## 已完成修复

1. 桌面快捷方式 `C:\Users\嘉十一\Desktop\Codex自动化工作台.lnk` 已指向稳定启动脚本。
2. 新增 `automation-workbench/scripts/start-workbench-desktop.ps1`，双击时优先用夸克浏览器打开工作台。
3. `open-workbench.ps1` 改为直接检查 `/api/health`，只接受同时具备 `dataHub`、`operationsCenter`、`platformOpener` 的当前 bridge。
4. bridge 端口回退范围扩展到 20 次，避免旧服务占用多个端口时启动失败。
5. 工作台前端的平台来源卡片新增“打开”按钮，可通过本机 bridge 调用 `/api/platforms/open` 打开已配置平台。
6. 已配置平台接口可返回 Kalodata、FastMoss、达秘 / TikClubs、飞书、微信、163 邮箱、Gmail、TikTok、YouTube、Instagram、抖音、小红书、SEC、HKEXnews、GitHub、Google Scholar 等入口。

## 验证结果

- 桌面启动脚本无弹窗验证返回：`http://127.0.0.1:8800/automation-workbench/app/`
- `/api/health` 返回 `platformOpener: true`
- `/api/platforms` 返回真实平台入口列表
- 页面标题：`第二大脑自动化工作台 v4`
- 页面状态：共享队列已连接
- 页面平台打开按钮：17 个
- 浏览器控制台错误：0 条
- 相关自动化测试：36 项全部通过
- 云端共享构建：成功生成 `.pages-site`

## 仍需人工确认的边界

平台“接入”目前代表：工作台可以打开真实平台官网、保持入口配置、生成后端执行口令，并在我执行任务时通过浏览器、页面可见内容、API 或导出文件进行处理。账号级数据读取仍需要你在对应平台完成登录、授权或导出数据。

我不会读取、保存或绕过密码、验证码、支付密码、交易密码；真实发送邮件/消息、上传、付款、交易下单等动作仍会在最终动作前停下来让你确认。
