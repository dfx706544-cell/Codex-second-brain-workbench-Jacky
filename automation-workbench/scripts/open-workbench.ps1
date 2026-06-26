$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Workspace = Split-Path -Parent $Root
$Bridge = Join-Path $Root "scripts\workbench-bridge.mjs"
$QueueDir = Join-Path $Root "queue"
$StatusPath = Join-Path $QueueDir "bridge-status.json"
$Node = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (-not (Test-Path -LiteralPath $Bridge)) {
  throw "Workbench bridge not found: $Bridge"
}

if (-not (Test-Path -LiteralPath $Node)) {
  $Node = "node"
}

if (-not (Test-Path -LiteralPath $QueueDir)) {
  New-Item -ItemType Directory -Path $QueueDir | Out-Null
}

function Get-WorkbenchBridgeHealth {
  param([int]$Port)

  try {
    $HealthUrl = "http://127.0.0.1:$Port/api/health"
    $Health = Invoke-WebRequest -UseBasicParsing -Uri $HealthUrl -TimeoutSec 1 | ConvertFrom-Json
    if ($Health.capabilities.dataHub -eq $true -and $Health.capabilities.operationsCenter -eq $true -and $Health.workbenchRoot -eq $Root) {
      return $Health
    }
  } catch {
    return $null
  }

  return $null
}

$ExistingStatus = $null
if (Test-Path -LiteralPath $StatusPath) {
  try {
    $ExistingStatus = Get-Content -Raw -Encoding UTF8 -LiteralPath $StatusPath | ConvertFrom-Json
  } catch {
    $ExistingStatus = $null
  }
}

$ShouldStart = $true
if ($ExistingStatus -and $ExistingStatus.port) {
  $Connection = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $ExistingStatus.port -State Listen -ErrorAction SilentlyContinue
  if ($Connection) {
    $Health = Get-WorkbenchBridgeHealth -Port $ExistingStatus.port
    if ($Health) {
      $ShouldStart = $false
    }
  }
}

if ($ShouldStart) {
  Start-Process -FilePath $Node -ArgumentList @($Bridge, "--host", "127.0.0.1", "--port", "8787") -WorkingDirectory $Workspace -WindowStyle Hidden
}

$AppUrl = $null
for ($i = 0; $i -lt 30; $i++) {
  $CandidatePorts = @(8787..8796)
  if (Test-Path -LiteralPath $StatusPath) {
    try {
      $Status = Get-Content -Raw -Encoding UTF8 -LiteralPath $StatusPath | ConvertFrom-Json
      if ($Status.port) {
        $CandidatePorts = @([int]$Status.port) + $CandidatePorts
      }
    } catch {
      $CandidatePorts = @(8787..8796)
    }
  }

  foreach ($Port in ($CandidatePorts | Select-Object -Unique)) {
    $Health = Get-WorkbenchBridgeHealth -Port $Port
    if ($Health) {
      $AppUrl = "http://127.0.0.1:$Port/automation-workbench/app/"
      break
    }
  }

  if ($AppUrl) {
    break
  }

  Start-Sleep -Milliseconds 300
}

if (-not $AppUrl) {
  throw "Could not start a current automation workbench bridge with data hub support."
}

Start-Process $AppUrl
