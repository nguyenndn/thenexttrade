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

$secureToken = Read-Host "One-time enrollment token" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
    $env:GSN_ENROLLMENT_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    & $python $worker --config $config --enroll
    if ($LASTEXITCODE -ne 0) { throw "Worker enrollment failed with exit code $LASTEXITCODE" }
} finally {
    Remove-Item Env:\GSN_ENROLLMENT_TOKEN -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}

Write-Host "Worker token encrypted with Windows DPAPI for the current user." -ForegroundColor Green
