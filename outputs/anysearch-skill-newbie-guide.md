# AnySearch Skill 新手教程

这份教程是给当前电脑上的 Codex 使用的。你不需要会编程，只要知道它能做什么、文件放在哪里、怎么让我调用即可。

## 1. 它已经安装在哪里

我已经把 AnySearch skill 安装到了：

```text
C:\Users\嘉十一\.codex\skills\anysearch
```

当前项目里只是放教程和工作文件；真正的 skill 放在 Codex 的个人技能目录里。

安装后建议重启一次 Codex，这样 Codex 会重新扫描并加载新 skill。

## 2. AnySearch 是做什么的

AnySearch 是一个实时搜索工具，适合这些场景：

- 查最新资料、新闻、政策、产品信息
- 验证某个说法是否准确
- 读取网页正文内容
- 查专业领域资料，比如金融、论文、法律、代码文档、安全漏洞等
- 一次并行搜索多个问题

简单理解：以后你问我“查一下最新资料”“帮我核实一下这个网页内容”，我可以优先用 AnySearch。

## 3. 是否需要 API Key

API Key 不是必须的。

- 不配置：可以匿名使用，但额度较低
- 配置：搜索额度更高，更稳定

如果你暂时只是试用，可以先不配。

如果之后需要配置 API Key：

1. 打开 AnySearch API Key 页面：

```text
https://anysearch.com/console/api-keys
```

2. 创建一个 key。
3. 在下面这个文件里填写：

```text
C:\Users\嘉十一\.codex\skills\anysearch\.env
```

文件内容格式是：

```text
ANYSEARCH_API_KEY=你的key
```

注意：不要把 API Key 直接发在聊天里。更安全的方式是你自己写进 `.env` 文件。

## 4. 我已经为你设置好的运行方式

因为你的电脑当前没有全局 `python`、`node` 命令，所以我为 AnySearch 配置了 PowerShell 运行方式。

配置文件在：

```text
C:\Users\嘉十一\.codex\skills\anysearch\runtime.conf
```

内容大意是：

```text
Runtime: PowerShell
Command: powershell -ExecutionPolicy Bypass -File C:\Users\嘉十一\.codex\skills\anysearch\scripts\anysearch_cli.ps1
```

你一般不需要手动执行这些命令，我会帮你调用。

## 5. 你以后怎么让我使用它

你可以直接这样说：

```text
用 AnySearch 查一下这个主题的最新信息：……
```

或者：

```text
帮我用 AnySearch 验证一下这个说法是否正确：……
```

或者：

```text
帮我用 AnySearch 读取这个网页并总结重点：https://example.com
```

如果是专业领域，建议你说清楚用途：

```text
用 AnySearch 查一下英伟达最近一季财报的关键数据，用于做PPT。
```

```text
用 AnySearch 查一下某个论文 DOI 的摘要和来源。
```

```text
用 AnySearch 查一下某个 CVE 漏洞的影响和修复建议。
```

## 6. 手动测试命令

如果你想自己测试，可以在 PowerShell 里运行：

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\嘉十一\.codex\skills\anysearch\scripts\anysearch_cli.ps1" search "OpenAI latest news" --max_results 3
```

读取网页：

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\嘉十一\.codex\skills\anysearch\scripts\anysearch_cli.ps1" extract "https://example.com"
```

查看帮助：

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\嘉十一\.codex\skills\anysearch\scripts\anysearch_cli.ps1" doc
```

## 7. 和你的 Office 自动化工作流怎么结合

你之前搭的 Office 自动化流程可以这样接 AnySearch：

### 场景 A：做 PPT 前先查资料

你说：

```text
用 AnySearch 查找新能源汽车行业最近趋势，然后基于资料生成一份10页PPT。
```

我会先查资料，再做 PPT。

### 场景 B：做 Excel 报表时补充外部数据

你说：

```text
用 AnySearch 查找行业平均增长率，然后把它作为对比基准加入Excel报表。
```

我会把来源和数据写进工作簿，避免数字来路不明。

### 场景 C：做 Word 报告时引用网页资料

你说：

```text
用 AnySearch 搜索政策背景资料，然后整理成Word报告的背景章节。
```

我会把来源记录下来，再写进文档。

## 8. 重要提醒

- 不要用搜索工具处理密码、身份证号、客户隐私、公司机密等敏感内容。
- 需要最新信息时，可以明确说“用 AnySearch 查最新资料”。
- 安装新 skill 后，最好重启 Codex。
- 如果搜索额度不够，再配置 API Key。

## 9. 给新手的最简单用法

你只需要记住三句话：

```text
用 AnySearch 查一下……
```

```text
用 AnySearch 读取这个网页……
```

```text
用 AnySearch 查资料，然后帮我做成 Excel/PPT/Word。
```

