[CmdletBinding()]
param(
    [string]$ApiBaseUrl = "http://127.0.0.1:8765",
    [string]$SecretsFile = ""
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($SecretsFile)) {
    $SecretsFile = Join-Path $PSScriptRoot "..\api\data\local-secrets.json"
}
$secrets = Get-Content -LiteralPath $SecretsFile -Raw | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($secrets.admin_token)" }
$result = Invoke-RestMethod -Method Get -Uri "$($ApiBaseUrl.TrimEnd('/'))/admin/v1/workers" -Headers $headers
$result.workers | Format-Table id,status,last_heartbeat,current_job_id,version -AutoSize
