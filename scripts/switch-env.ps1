# Switch Environment Script
# Usage: .\scripts\switch-env.ps1 local|production

param(
[Parameter(Mandatory=$true)]
[ValidateSet('local', 'production')]
[string]$Environment
)

$rootDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $rootDir ".env"
$sourceFile = Join-Path $rootDir ".env.$Environment"

if (-not (Test-Path $sourceFile)) {
    Write-Error "Environment file not found: $sourceFile"
    exit 1
}

# Backup logic removed as per user request
# if (Test-Path $envFile) {
#     $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
#     $backupFile = Join-Path $rootDir ".env.backup.$timestamp"
#     Copy-Item $envFile $backupFile
#     Write-Host "Backed up current .env to: .env.backup.$timestamp" -ForegroundColor Green
# }

# Copy environment file
Copy-Item $sourceFile $envFile -Force

Write-Host "Switched to $Environment environment!" -ForegroundColor Green
Write-Host "Current environment file: .env.$Environment" -ForegroundColor Cyan

# Show database connection
$dbUrl = Select-String -Path $envFile -Pattern "^DATABASE_URL=" | Select-Object -First 1
if ($dbUrl) {
    Write-Host "`nDatabase Connection:" -ForegroundColor Yellow
    Write-Host $dbUrl.Line -ForegroundColor Gray
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "   1. Verify .env file contents" -ForegroundColor Gray
Write-Host "   2. Run: npm run dev" -ForegroundColor Gray
Write-Host "   3. Test: npx tsx scripts/measure-performance.ts" -ForegroundColor Gray
