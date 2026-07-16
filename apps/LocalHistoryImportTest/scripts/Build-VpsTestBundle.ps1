[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackendBaseUrl,
    [string]$OutputDirectory = "",
    [string]$Mt5InstallerUrl = "https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe"
)

$ErrorActionPreference = "Stop"
$localTestRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $localTestRoot "dist\GSN-VPS-Test-Bundle"
}
$project = (Resolve-Path "$PSScriptRoot\..\..").Path
$bootstrapSource = Join-Path $project "WindowsWorkerBootstrap"
$workerSource = Join-Path $project "LocalHistoryImportTest\worker"
$output = [IO.Path]::GetFullPath($OutputDirectory)

if ($BackendBaseUrl -notmatch '^https://' -and $BackendBaseUrl -notmatch '^http://(127\.0\.0\.1|localhost)(:\d+)?/?$') {
    throw "Use HTTPS for a remote VPS. HTTP is accepted only for same-PC loopback testing."
}
if (Test-Path -LiteralPath $output) {
    $resolvedOutput = (Resolve-Path -LiteralPath $output).Path
    $allowedParent = [IO.Path]::GetFullPath((Join-Path $localTestRoot "dist")).TrimEnd('\')
    if (-not $resolvedOutput.StartsWith($allowedParent, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to replace output outside LocalHistoryImportTest\dist: $resolvedOutput"
    }
    Remove-Item -LiteralPath $resolvedOutput -Recurse -Force
}
New-Item -ItemType Directory -Path $output -Force | Out-Null
Copy-Item -Path (Join-Path $bootstrapSource "*") -Destination $output -Recurse -Force

$workerDestination = Join-Path $output "worker-package"
New-Item -ItemType Directory -Path $workerDestination -Force | Out-Null
foreach ($file in @("worker.py", "token_store.py", "requirements.txt", "Enroll-GSNWorker.ps1", "start_local_worker.py", "START_LOCAL_WORKER.bat", "UPDATE_LOCAL_WORKER.bat", "Update-ControlledWorker.ps1")) {
    Copy-Item -LiteralPath (Join-Path $workerSource $file) -Destination $workerDestination -Force
}

$config = Get-Content -LiteralPath (Join-Path $bootstrapSource "bootstrap.config.example.json") -Raw | ConvertFrom-Json
$config.backendBaseUrl = $BackendBaseUrl.TrimEnd('/')
$config.allowInsecureLocalhost = $BackendBaseUrl -match '^http://(127\.0\.0\.1|localhost)'
$config.mt5.installerUrl = $Mt5InstallerUrl
$config.workerPackage.packageUrl = ""
$config.workerPackage.sha256 = ""
$config.workerPackage.localSourceDirectory = "worker-package"
$config.workerPackage.entrypoint = "worker.py"
$config.workerPackage.requirementsFile = "requirements.txt"
$config.workerPackage.requirePackage = $true
$config | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $output "bootstrap.config.json") -Encoding UTF8

$hashes = Get-ChildItem -LiteralPath $output -File -Recurse | ForEach-Object {
    [ordered]@{
        path = $_.FullName.Substring($output.Length + 1).Replace('\', '/')
        sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}
$manifest = [ordered]@{
    schemaVersion = "1.0"
    createdAtUtc = (Get-Date).ToUniversalTime().ToString("o")
    backendBaseUrl = $config.backendBaseUrl
    files = $hashes
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $output "bundle-manifest.json") -Encoding UTF8

Write-Host "VPS test bundle created: $output" -ForegroundColor Green
Write-Host "Copy the whole folder to the VPS and run GSN_INSTALL_WINDOWS_WORKER.bat." -ForegroundColor Cyan
