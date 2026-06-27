param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OpenWorkbench = Join-Path $ScriptDir "open-workbench.ps1"

if (-not (Test-Path -LiteralPath $OpenWorkbench)) {
  throw "open-workbench.ps1 not found: $OpenWorkbench"
}

$AppUrl = powershell -NoProfile -ExecutionPolicy Bypass -File $OpenWorkbench -NoBrowser
$AppUrl = ($AppUrl | Select-Object -Last 1).Trim()

if ([string]::IsNullOrWhiteSpace($AppUrl)) {
  throw "Workbench URL was empty."
}

if ($NoBrowser) {
  Write-Output $AppUrl
  return
}

$QuarkCandidates = @(
  (Join-Path $env:LOCALAPPDATA "Programs\Quark\quark.exe"),
  (Join-Path $env:LOCALAPPDATA "Quark\quark.exe"),
  (Join-Path $env:ProgramFiles "Quark\quark.exe"),
  (Join-Path ${env:ProgramFiles(x86)} "Quark\quark.exe")
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

if ($QuarkCandidates.Count -gt 0) {
  Start-Process -FilePath $QuarkCandidates[0] -ArgumentList @($AppUrl)
} else {
  Start-Process $AppUrl
}
