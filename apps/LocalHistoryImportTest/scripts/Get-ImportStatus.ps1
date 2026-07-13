[CmdletBinding()]
param(
    [string]$ApiBaseUrl = "http://127.0.0.1:8765",
    [Parameter(Mandatory = $true)][string]$JobId,
    [string]$SecretsFile = ""
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($SecretsFile)) {
    $SecretsFile = Join-Path $PSScriptRoot "..\api\data\local-secrets.json"
}
$secrets = Get-Content -LiteralPath $SecretsFile -Raw | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($secrets.user_token)" }
$result = Invoke-RestMethod -Method Get -Uri "$($ApiBaseUrl.TrimEnd('/'))/v1/imports/$JobId" -Headers $headers
$result | Format-List
