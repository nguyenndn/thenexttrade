[CmdletBinding()]
param(
    [string]$ApiBaseUrl = "http://127.0.0.1:8765",
    [Parameter(Mandatory = $true)]
    [string]$WorkerId,
    [string]$SecretsFile = ""
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($SecretsFile)) {
    $SecretsFile = Join-Path $PSScriptRoot "..\api\data\local-secrets.json"
}
$secrets = Get-Content -LiteralPath $SecretsFile -Raw | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($secrets.admin_token)" }
$body = @{ worker_id = $WorkerId; ttl_minutes = 15 } | ConvertTo-Json
$result = Invoke-RestMethod -Method Post -Uri "$($ApiBaseUrl.TrimEnd('/'))/admin/v1/workers/enrollment-tokens" -Headers $headers -ContentType "application/json" -Body $body

Write-Host "Worker: $($result.worker_id)" -ForegroundColor Cyan
Write-Host "Expires: $($result.expires_at)"
Write-Host "Enrollment token (shown once):" -ForegroundColor Yellow
Write-Host $result.enrollment_token
