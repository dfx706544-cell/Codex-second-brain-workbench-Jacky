param(
  [switch]$Remove
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OpenWorkbench = Join-Path $ScriptDir "open-workbench.ps1"
$TaskName = "WuyinSecondBrainWorkbenchBridge"
$TaskDescription = "Keep the Wuyin second brain workbench bridge available for desktop shortcuts and Quark bookmarks."
$StartupShortcutName = "WuyinSecondBrainWorkbenchBridge.lnk"
$StartupShortcutPath = Join-Path ([Environment]::GetFolderPath("Startup")) $StartupShortcutName

if (-not (Test-Path -LiteralPath $OpenWorkbench)) {
  throw "open-workbench.ps1 not found: $OpenWorkbench"
}

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  if (Test-Path -LiteralPath $StartupShortcutPath) {
    Remove-Item -LiteralPath $StartupShortcutPath -Force
  }
  Write-Output "Removed scheduled task: $TaskName"
  Write-Output "Removed startup shortcut: $StartupShortcutPath"
  return
}

$PowerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$OpenWorkbench`" -NoBrowser"
$Action = New-ScheduledTaskAction `
  -Execute $PowerShell `
  -Argument $Arguments
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 5)
$Task = New-ScheduledTask `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Description $TaskDescription

$Task.Settings.ExecutionTimeLimit = "PT5M"

try {
  Register-ScheduledTask `
    -TaskName $TaskName `
    -InputObject $Task `
    -Force | Out-Null

  Write-Output "Installed scheduled task: $TaskName"
} catch {
  $StartupDir = Split-Path -Parent $StartupShortcutPath
  if (-not (Test-Path -LiteralPath $StartupDir)) {
    New-Item -ItemType Directory -Path $StartupDir | Out-Null
  }

  $Shell = New-Object -ComObject WScript.Shell
  $Shortcut = $Shell.CreateShortcut($StartupShortcutPath)
  $Shortcut.TargetPath = $PowerShell
  $Shortcut.Arguments = $Arguments
  $Shortcut.WorkingDirectory = Split-Path -Parent (Split-Path -Parent $ScriptDir)
  $Shortcut.WindowStyle = 7
  $Shortcut.Description = $TaskDescription
  $Shortcut.IconLocation = "$PowerShell,0"
  $Shortcut.Save()

  Write-Output "Scheduled task install failed: $($_.Exception.Message)"
  Write-Output "Installed startup shortcut fallback: $StartupShortcutPath"
}
