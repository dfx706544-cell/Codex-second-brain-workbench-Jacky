param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OpenWorkbench = Join-Path $ScriptDir "open-workbench.ps1"
$WorkbenchRoot = Split-Path -Parent $ScriptDir
$LogDir = Join-Path $WorkbenchRoot ".tmp"
$LogPath = Join-Path $LogDir "desktop-launch.log"

if (-not (Test-Path -LiteralPath $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir | Out-Null
}

function Write-WorkbenchDesktopLog {
  param([string]$Message)
  $Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
  Add-Content -LiteralPath $LogPath -Encoding UTF8 -Value "[$Timestamp] $Message"
}

try {
  Write-WorkbenchDesktopLog "Launching Wuyin desktop entry."

  if (-not (Test-Path -LiteralPath $OpenWorkbench)) {
    throw "open-workbench.ps1 not found: $OpenWorkbench"
  }

  $OpenTimer = [Diagnostics.Stopwatch]::StartNew()
  $AppUrl = powershell -NoProfile -ExecutionPolicy Bypass -File $OpenWorkbench -NoBrowser
  $OpenTimer.Stop()
  $AppUrl = ($AppUrl | Select-Object -Last 1).Trim()

  if ([string]::IsNullOrWhiteSpace($AppUrl)) {
    throw "Workbench URL was empty."
  }

  Write-WorkbenchDesktopLog "Open workbench resolved in $($OpenTimer.ElapsedMilliseconds) ms."
  Write-WorkbenchDesktopLog "Resolved app URL: $AppUrl"

  if ($NoBrowser) {
    Write-Output $AppUrl
    return
  }

  $QuarkCandidates = @(@(
    (Join-Path $env:LOCALAPPDATA "Programs\Quark\quark.exe"),
    (Join-Path $env:LOCALAPPDATA "Quark\quark.exe"),
    (Join-Path $env:ProgramFiles "Quark\quark.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "Quark\quark.exe")
  ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) })

  if ($QuarkCandidates.Count -gt 0) {
    Write-WorkbenchDesktopLog "Opening in Quark: $($QuarkCandidates[0])"
    Start-Process -FilePath $QuarkCandidates[0] -ArgumentList @("--new-window", $AppUrl)
  } else {
    Write-WorkbenchDesktopLog "Quark not found. Opening with default handler."
    Start-Process $AppUrl
  }
} catch {
  Write-WorkbenchDesktopLog "ERROR: $($_.Exception.Message)"
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show(
    "Wuyin second brain workbench failed to launch: $($_.Exception.Message)`n`nLog: $LogPath",
    "Wuyin second brain workbench"
  ) | Out-Null
  throw
}
