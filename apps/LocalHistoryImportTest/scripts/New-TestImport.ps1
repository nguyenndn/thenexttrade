[CmdletBinding()]
param(
    [string]$ApiBaseUrl = "http://127.0.0.1:8765",
    [Parameter(Mandatory = $true)][string]$Login,
    [Parameter(Mandatory = $true)][string]$BrokerName,
    [Parameter(Mandatory = $true)][string]$Server,
    [datetime]$From = (Get-Date).ToUniversalTime().AddDays(-7),
    [datetime]$To = (Get-Date).ToUniversalTime(),
    [string]$SecretsFile = ""
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($SecretsFile)) {
    $SecretsFile = Join-Path $PSScriptRoot "..\api\data\local-secrets.json"
}
$secrets = Get-Content -LiteralPath $SecretsFile -Raw | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($secrets.user_token)" }
$securePassword = Read-Host "MT5 Investor Password" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $accountBody = @{
        label = "Local test $Login"
        login = $Login
        broker_name = $BrokerName
        server = $Server
        investor_password = $plainPassword
    } | ConvertTo-Json
    $account = Invoke-RestMethod -Method Post -Uri "$($ApiBaseUrl.TrimEnd('/'))/v1/mt5-accounts" -Headers $headers -ContentType "application/json" -Body $accountBody
    $plainPassword = $null
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}

$importBody = @{
    from = $From.ToUniversalTime().ToString("o")
    to = $To.ToUniversalTime().ToString("o")
    mode = "FULL"
} | ConvertTo-Json
$job = Invoke-RestMethod -Method Post -Uri "$($ApiBaseUrl.TrimEnd('/'))/v1/mt5-accounts/$($account.id)/imports" -Headers $headers -ContentType "application/json" -Body $importBody

Write-Host "Account ID: $($account.id)" -ForegroundColor Cyan
Write-Host "Job ID: $($job.job_id)" -ForegroundColor Green
Write-Host "Status command: .\Get-ImportStatus.ps1 -JobId $($job.job_id)"
