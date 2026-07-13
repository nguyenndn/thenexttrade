[CmdletBinding()]
param([string]$ConfigPath = "")

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
    $ConfigPath = Join-Path $PSScriptRoot "bootstrap.config.json"
}
& "$PSScriptRoot\Install-GSNWorker.ps1" -ConfigPath $ConfigPath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& "$PSScriptRoot\Verify-GSNWorker.ps1"
exit $LASTEXITCODE
