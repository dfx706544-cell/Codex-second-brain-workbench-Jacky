param(
  [switch]$Watch,
  [switch]$Execute,
  [switch]$AllowSensitive,
  [int]$IntervalMs = 10000
)

$ErrorActionPreference = "Stop"

$WorkbenchRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$WorkspaceRoot = Split-Path -Parent $WorkbenchRoot
$Runner = Join-Path $WorkbenchRoot "scripts\workbench-codex-runner.mjs"
$QueuePath = Join-Path $WorkbenchRoot "queue\tasks.json"
$Node = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (-not (Test-Path -LiteralPath $Node)) {
  $Node = "node"
}

if (-not (Test-Path -LiteralPath $Runner)) {
  throw "Codex queue runner not found: $Runner"
}

$Args = @(
  $Runner,
  "--queue", $QueuePath,
  "--workspace", $WorkspaceRoot,
  "--interval-ms", "$IntervalMs"
)

if ($Watch) {
  $Args += "--watch"
} else {
  $Args += "--once"
}

if ($Execute) {
  $Args += "--execute"
}

if ($AllowSensitive) {
  $Args += "--allow-sensitive"
}

& $Node @Args
