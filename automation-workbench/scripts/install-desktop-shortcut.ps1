param(
  [string]$ShortcutName = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Workspace = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$Launcher = Join-Path $ScriptDir "start-workbench-desktop.ps1"

if ([string]::IsNullOrWhiteSpace($ShortcutName)) {
  $ShortcutName = [string]([char]0x65E0) + [string]([char]0x57A0) +
    [string]([char]0x7B2C) + [string]([char]0x4E8C) + [string]([char]0x5927) + [string]([char]0x8111) +
    [string]([char]0x5DE5) + [string]([char]0x4F5C) + [string]([char]0x53F0) + ".lnk"
}

if (-not (Test-Path -LiteralPath $Launcher)) {
  throw "Desktop launcher not found: $Launcher"
}

$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop $ShortcutName
$PowerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$QuarkIcon = Join-Path $env:LOCALAPPDATA "Programs\Quark\quark.exe"

$OldShortcutNames = @(
  "Codex" + [string]([char]0x81EA) + [string]([char]0x52A8) + [string]([char]0x5316) +
    [string]([char]0x5DE5) + [string]([char]0x4F5C) + [string]([char]0x53F0) + ".lnk",
  [string]([char]0x5341) + [string]([char]0x4E00) +
    [string]([char]0x7B2C) + [string]([char]0x4E8C) + [string]([char]0x5927) + [string]([char]0x8111) +
    [string]([char]0x5DE5) + [string]([char]0x4F5C) + [string]([char]0x53F0) + ".lnk"
) | Where-Object { $_ -ne $ShortcutName }

foreach ($OldShortcutName in $OldShortcutNames) {
  $OldShortcutPath = Join-Path $Desktop $OldShortcutName
  if (Test-Path -LiteralPath $OldShortcutPath) {
    Remove-Item -LiteralPath $OldShortcutPath -Force
  }
}

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $PowerShell
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$Launcher`""
$Shortcut.WorkingDirectory = $Workspace
$Shortcut.WindowStyle = 7
$Shortcut.Description = "Open Wuyin second brain automation workbench"

if (Test-Path -LiteralPath $QuarkIcon) {
  $Shortcut.IconLocation = "$QuarkIcon,0"
} else {
  $Shortcut.IconLocation = "$PowerShell,0"
}

$Shortcut.Save()
Write-Output $ShortcutPath
