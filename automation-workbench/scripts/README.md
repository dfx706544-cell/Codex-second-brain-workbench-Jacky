# 脚本说明

这些脚本是 Windows PowerShell 辅助入口。

## 打开工作台

```powershell
powershell -ExecutionPolicy Bypass -File "automation-workbench\scripts\open-workbench.ps1"
```

这个脚本会启动本地桥接服务，并打开共享队列版工作台。页面里应该显示“共享队列已连接”。

如果 8787 端口被占用，脚本会自动使用后续端口，并根据 `automation-workbench\queue\bridge-status.json` 打开正确地址。

## 打开剪映

先在 `automation-workbench/config/settings.json` 里配置：

```json
"capcutPath": "你的剪映exe路径"
```

然后运行：

```powershell
powershell -ExecutionPolicy Bypass -File "automation-workbench\scripts\open-capcut.ps1"
```

## 打开询盘平台

先在 `automation-workbench/config/settings.json` 里把平台的 `enabled` 改成 `true`。

然后运行：

```powershell
powershell -ExecutionPolicy Bypass -File "automation-workbench\scripts\open-platform.ps1"
```

## 测试 AnySearch

```powershell
powershell -ExecutionPolicy Bypass -File "automation-workbench\scripts\check-anysearch.ps1"
```
