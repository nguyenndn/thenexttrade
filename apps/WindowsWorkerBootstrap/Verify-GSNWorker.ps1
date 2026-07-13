[CmdletBinding()]
param([string]$RootPath = "C:\GSN")

$ErrorActionPreference = "Stop"
$root = [IO.Path]::GetFullPath($RootPath).TrimEnd('\')
$workerConfigPath = Join-Path $root "config\worker.json"
$report = [ordered]@{
    checkedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
    rootPath = $root
    checks = @()
    ready = $true
}

function Add-Check([string]$Name, [bool]$Passed, [string]$Detail) {
    $script:report.checks += [ordered]@{ name = $Name; passed = $Passed; detail = $Detail }
    if (-not $Passed) { $script:report.ready = $false }
    $color = if ($Passed) { "Green" } else { "Red" }
    Write-Host ("[{0}] {1}: {2}" -f $(if ($Passed) { "PASS" } else { "FAIL" }), $Name, $Detail) -ForegroundColor $color
}

$venvPython = Join-Path $root "runtime\venv\Scripts\python.exe"
$terminal = Join-Path $root "mt5\terminal\terminal64.exe"
$installationReport = Join-Path $root "config\installation-report.json"

Add-Check "Root" (Test-Path -LiteralPath $root) $root
Add-Check "Worker config" (Test-Path -LiteralPath $workerConfigPath) $workerConfigPath
Add-Check "Python venv" (Test-Path -LiteralPath $venvPython) $venvPython
Add-Check "MT5 terminal" (Test-Path -LiteralPath $terminal) $terminal
Add-Check "Installation report" (Test-Path -LiteralPath $installationReport) $installationReport

if (Test-Path -LiteralPath $venvPython) {
    & $venvPython -c "import MetaTrader5, requests, psutil; print('Python imports OK')"
    Add-Check "Python dependencies" ($LASTEXITCODE -eq 0) "MetaTrader5, requests, psutil"
}

if (Test-Path -LiteralPath $workerConfigPath) {
    $config = Get-Content -LiteralPath $workerConfigPath -Raw | ConvertFrom-Json
    $backendIsSafe = ([string]$config.backendBaseUrl -match '^https://') -or ([string]$config.backendBaseUrl -match '^http://(127\.0\.0\.1|localhost)(:\d+)?/?$')
    Add-Check "Backend URL" $backendIsSafe ([string]$config.backendBaseUrl)
    $install = if (Test-Path -LiteralPath $installationReport) {
        Get-Content -LiteralPath $installationReport -Raw | ConvertFrom-Json
    } else { $null }
    $entrypoint = if ($null -ne $install) { [string]$install.workerEntrypoint } else { Join-Path $root "worker\worker.py" }
    Add-Check "Worker entrypoint" (Test-Path -LiteralPath $entrypoint) $entrypoint
    if ($null -ne $install -and [bool]$install.scheduledTaskCreated) {
        $task = Get-ScheduledTask -TaskName ([string]$install.scheduledTaskName) -ErrorAction SilentlyContinue
        Add-Check "Scheduled Task" ($null -ne $task) ([string]$install.scheduledTaskName)
    }
}

$reportPath = Join-Path $root "logs\verification-latest.json"
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $reportPath -Encoding UTF8
if (-not $report.ready) { exit 2 }
exit 0
