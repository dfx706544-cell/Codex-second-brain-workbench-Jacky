param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Workspace = Split-Path -Parent $Root
$Bridge = Join-Path $Root "scripts\workbench-bridge.mjs"
$PortAlias = Join-Path $Root "scripts\workbench-port-alias.mjs"
$QueueDir = Join-Path $Root "queue"
$StatusPath = Join-Path $QueueDir "bridge-status.json"
$Node = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (-not (Test-Path -LiteralPath $Bridge)) {
  throw "Workbench bridge not found: $Bridge"
}

if (-not (Test-Path -LiteralPath $PortAlias)) {
  throw "Workbench port alias helper not found: $PortAlias"
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
    $Request = [System.Net.WebRequest]::Create($HealthUrl)
    $Request.Timeout = 1500
    $Request.ReadWriteTimeout = 1500
    $Response = $Request.GetResponse()
    $Reader = New-Object System.IO.StreamReader($Response.GetResponseStream())
    $HealthJson = $Reader.ReadToEnd()
    $Reader.Close()
    $Response.Close()
    $Health = $HealthJson | ConvertFrom-Json
    if (
      $Health.capabilities.dataHub -eq $true -and
      $Health.capabilities.operationsCenter -eq $true -and
      $Health.capabilities.platformOpener -eq $true -and
      $Health.workbenchRoot -eq $Root
    ) {
      return $Health
    }
  } catch {
    return $null
  }

  return $null
}

function Get-StatusPort {
  if (-not (Test-Path -LiteralPath $StatusPath)) {
    return $null
  }

  try {
    $Status = Get-Content -Raw -Encoding UTF8 -LiteralPath $StatusPath | ConvertFrom-Json
    if ($Status.port) {
      return [int]$Status.port
    }
  } catch {
    return $null
  }

  return $null
}

function Start-WorkbenchPortAlias {
  $AliasPorts = "8788,8800"
  $ExistingAlias = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*workbench-port-alias.mjs*" -and $_.CommandLine -like "*$Root*" } |
    Select-Object -First 1

  if ($ExistingAlias) {
    return
  }

  Start-Process -FilePath $Node -ArgumentList @(
    $PortAlias,
    "--host", "127.0.0.1",
    "--ports", $AliasPorts,
    "--workbench-root", $Root
  ) -WorkingDirectory $Workspace -WindowStyle Hidden
}

$ExistingStatus = $null
if (Test-Path -LiteralPath $StatusPath) {
  try {
    $ExistingStatus = Get-Content -Raw -Encoding UTF8 -LiteralPath $StatusPath | ConvertFrom-Json
  } catch {
    $ExistingStatus = $null
  }
}

$AppUrl = $null
$FallbackPorts = @(8787)
$CandidatePorts = $FallbackPorts
if ($ExistingStatus -and $ExistingStatus.port) {
  $CandidatePorts = @([int]$ExistingStatus.port) + $CandidatePorts
}

foreach ($Port in ($CandidatePorts | Select-Object -Unique)) {
  $Health = Get-WorkbenchBridgeHealth -Port $Port
  if ($Health) {
    $AppUrl = "http://127.0.0.1:$Port/automation-workbench/app/"
    break
  }
}

if (-not $AppUrl) {
  $StartPort = 8787
  Start-Process -FilePath $Node -ArgumentList @($Bridge, "--host", "127.0.0.1", "--port", "$StartPort") -WorkingDirectory $Workspace -WindowStyle Hidden

  for ($i = 0; $i -lt 30; $i++) {
    $CandidatePorts = $FallbackPorts
    $StatusPort = Get-StatusPort
    if ($StatusPort) {
      $CandidatePorts = @($StatusPort) + $CandidatePorts
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
}

if (-not $AppUrl) {
  throw "Could not start a current automation workbench bridge with data hub support."
}

Start-WorkbenchPortAlias

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
