[CmdletBinding()]
param(
    [string]$InstallRoot = "C:\GSN"
)

$ErrorActionPreference = "Stop"
$sourceFiles = @(
    "worker.py",
    "token_store.py",
    "start_local_worker.py",
    "START_LOCAL_WORKER.bat",
    "Enroll-GSNWorker.ps1"
)
$targetDirectory = Join-Path $InstallRoot "worker"

if (-not (Test-Path -LiteralPath $targetDirectory)) {
    throw "Installed worker directory not found: $targetDirectory"
}

foreach ($file in $sourceFiles) {
    $source = Join-Path $PSScriptRoot $file
    if (-not (Test-Path -LiteralPath $source)) { throw "Source file not found: $source" }
    Copy-Item -LiteralPath $source -Destination (Join-Path $targetDirectory $file) -Force
}

Write-Host "Updated worker package in $targetDirectory" -ForegroundColor Green
Write-Host "Stop the old worker, then double-click $targetDirectory\START_LOCAL_WORKER.bat" -ForegroundColor Cyan
