# 工作台共享任务队列

新版工作台会把执行队列保存到这个目录里的 `tasks.json`。

## 正常使用

1. 运行：

```powershell
powershell -ExecutionPolicy Bypass -File "automation-workbench\scripts\open-workbench.ps1"
```

2. 在页面里确认队列区域显示：

```text
共享队列已连接
```

3. 输入需求并点击“加入执行队列”。
4. 回到 Codex 聊天，说：

```text
请打开我们制作的自动化工作台，处理里面的执行队列。
```

Codex 会优先读取：

```text
automation-workbench/queue/tasks.json
```

## 如果你已经在旧页面加入过队列

旧版页面可能把任务存在浏览器自己的 `localStorage` 里，Codex 无法直接读取。

恢复方式：

1. 先运行 `open-workbench.ps1`。
2. 刷新你刚才加入任务的工作台页面。
3. 如果页面显示“共享队列已连接”，旧队列会自动迁移到 `tasks.json`。
4. 如果仍然显示“本地备份模式”，请用脚本打开的新页面重新点击一次“加入执行队列”。

## 文件说明

- `tasks.json`：共享任务队列，最新任务通常在最上方。
- `bridge-status.json`：本地桥接服务当前地址，供启动脚本打开正确页面。

不要手动编辑 `bridge-status.json`。如果需要清空任务，优先在工作台页面点击“清空”。
