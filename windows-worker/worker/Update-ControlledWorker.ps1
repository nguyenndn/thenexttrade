[CmdletBinding()]
param(
    [string]$InstallRoot = "C:\GSN"
)

$ErrorActionPreference = "Stop"
$sourceWorker = Join-Path $PSScriptRoot "worker.py"
$targetWorker = Join-Path $InstallRoot "worker\worker.py"

if (-not (Test-Path -LiteralPath $sourceWorker)) {
    throw "Source worker.py not found: $sourceWorker"
}
if (-not (Test-Path -LiteralPath (Split-Path -Parent $targetWorker))) {
    throw "Installed worker directory not found: $(Split-Path -Parent $targetWorker)"
}

Copy-Item -LiteralPath $sourceWorker -Destination $targetWorker -Force
Write-Host "Updated $targetWorker" -ForegroundColor Green
Write-Host "Stop the old worker process, then start with: $targetWorker --config $InstallRoot\config\worker.json"
