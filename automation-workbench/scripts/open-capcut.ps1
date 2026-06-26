$ErrorActionPreference = "Stop"
$ConfigPath = Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) "config\settings.json"
$ConfigText = [System.IO.File]::ReadAllText($ConfigPath, [System.Text.Encoding]::UTF8)
$Config = $ConfigText | ConvertFrom-Json
$CapcutPath = $Config.editing.capcutPath
if ([string]::IsNullOrWhiteSpace($CapcutPath)) {
  Write-Host "CapCut/Jianying path is not configured."
  Write-Host "Edit automation-workbench/config/settings.json and set editing.capcutPath."
  exit 1
}
if (-not (Test-Path -LiteralPath $CapcutPath)) {
  throw "Configured CapCut/Jianying path does not exist: $CapcutPath"
}
Start-Process -FilePath $CapcutPath
