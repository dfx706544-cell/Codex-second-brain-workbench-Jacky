param(
  [string]$Name = ""
)

$ErrorActionPreference = "Stop"
$ConfigPath = Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) "config\settings.json"
$ConfigText = [System.IO.File]::ReadAllText($ConfigPath, [System.Text.Encoding]::UTF8)
$Config = $ConfigText | ConvertFrom-Json

$Platforms = @($Config.workAssistant.platforms)
if ($Name) {
  $Platforms = $Platforms | Where-Object { $_.name -like "*$Name*" }
}

if (-not $Platforms -or $Platforms.Count -eq 0) {
  Write-Host "No matching platform found. Edit automation-workbench/config/settings.json."
  exit 1
}

foreach ($Platform in $Platforms) {
  if (-not $Platform.enabled) {
    Write-Host "Skipping disabled platform: $($Platform.name)"
    continue
  }
  if ([string]::IsNullOrWhiteSpace($Platform.url)) {
    Write-Host "Skipping platform without URL: $($Platform.name)"
    continue
  }
  Start-Process $Platform.url
}
