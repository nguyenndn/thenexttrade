[CmdletBinding()]
param(
    [string]$RootPath = "C:\GSN"
)

$ErrorActionPreference = "Stop"
$python = Join-Path $RootPath "runtime\venv\Scripts\python.exe"
$worker = Join-Path $RootPath "worker\worker.py"
$config = Join-Path $RootPath "config\worker.json"

foreach ($path in @($python, $worker, $config)) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Required file missing: $path" }
}

$launcher = Join-Path $RootPath "worker\start_local_worker.py"
if (Test-Path -LiteralPath $launcher) {
    & $python $launcher --config $config --re-enroll
    if ($LASTEXITCODE -ne 0) { throw "Worker enrollment failed with exit code $LASTEXITCODE" }
} else {
    $token = Read-Host "One-time enrollment token (visible)"
    if ([string]::IsNullOrWhiteSpace($token)) { throw "Enrollment token cannot be empty." }
    Write-Host "Token received: $token"
    $confirmation = Read-Host "Use this token? [Y/n]"
    if ($confirmation -and $confirmation.ToLowerInvariant() -notin @("y", "yes")) { throw "Enrollment cancelled." }
    $env:GSN_ENROLLMENT_TOKEN = $token.Trim().Trim("'").Trim('"')
    try {
        & $python $worker --config $config --enroll
        if ($LASTEXITCODE -ne 0) { throw "Worker enrollment failed with exit code $LASTEXITCODE. Generate a fresh token for this Worker ID." }
    } finally {
        Remove-Item Env:\GSN_ENROLLMENT_TOKEN -ErrorAction SilentlyContinue
    }
}

Write-Host "Worker token encrypted with Windows DPAPI for the current user." -ForegroundColor Green
