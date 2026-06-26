$ErrorActionPreference = "Stop"
$SkillDir = "C:\Users\嘉十一\.codex\skills\anysearch"
$Cli = Join-Path $SkillDir "scripts\anysearch_cli.ps1"
if (-not (Test-Path -LiteralPath $Cli)) {
  throw "AnySearch CLI not found: $Cli"
}
powershell -ExecutionPolicy Bypass -File $Cli search "global markets business news" --max_results 3

