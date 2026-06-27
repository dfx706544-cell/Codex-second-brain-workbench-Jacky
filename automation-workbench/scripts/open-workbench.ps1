param(
  [switch]$NoBrowser
)

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

$ExistingStatus = $null
if (Test-Path -LiteralPath $StatusPath) {
  try {
    $ExistingStatus = Get-Content -Raw -Encoding UTF8 -LiteralPath $StatusPath | ConvertFrom-Json
  } catch {
    $ExistingStatus = $null
  }
}

$AppUrl = $null
$CandidatePorts = @(8787..8806)
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
  foreach ($Port in (8787..8806)) {
    $TcpClient = $null
    try {
      $TcpClient = New-Object System.Net.Sockets.TcpClient
      $Connection = $TcpClient.BeginConnect("127.0.0.1", $Port, $null, $null)
      $Connected = $Connection.AsyncWaitHandle.WaitOne(100, $false)
      if (-not $Connected) {
        $StartPort = $Port
        break
      }
      $TcpClient.EndConnect($Connection)
    } catch {
      $StartPort = $Port
      break
    } finally {
      if ($TcpClient) {
        $TcpClient.Close()
      }
    }
  }

  Start-Process -FilePath $Node -ArgumentList @($Bridge, "--host", "127.0.0.1", "--port", "$StartPort") -WorkingDirectory $Workspace -WindowStyle Hidden

  for ($i = 0; $i -lt 30; $i++) {
    $CandidatePorts = @(8787..8806)
    if (Test-Path -LiteralPath $StatusPath) {
      try {
        $Status = Get-Content -Raw -Encoding UTF8 -LiteralPath $StatusPath | ConvertFrom-Json
        if ($Status.port) {
          $CandidatePorts = @([int]$Status.port) + $CandidatePorts
        }
      } catch {
        $CandidatePorts = @(8787..8806)
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
}

if (-not $AppUrl) {
  throw "Could not start a current automation workbench bridge with data hub support."
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
